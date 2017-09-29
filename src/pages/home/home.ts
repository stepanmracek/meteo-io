import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable, Subscription } from 'rxjs'
import 'rxjs/add/operator/map'

import { IDbItem } from '../../app/interfaces';
import { ChartPage } from '../chart/chart';

export interface IMeasurement {
	measurement: string;
	value: number;
}

export interface IOverviewData {
	name: string;
	timestamp: Date;
	values: IMeasurement[]
}

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage implements OnInit {

	overviewData: IOverviewData[] = [];
	subscription: Subscription = null;

	constructor(public navCtrl: NavController, private db: AngularFireDatabase) {

	}

	dbValuesToMeasurement(data: IOverviewData, dbValues: IDbItem[]) {
		data.values.length = 0;
		if (dbValues.length == 0) {
			return;
		}

		data.timestamp = new Date(dbValues[0].$key);

		Object.keys(dbValues[0]).forEach(key => {
			data.values.push({measurement: key, value: dbValues[0][key]})
		})
	}

	ngOnInit() {
		this.subscription = this.db
			.list('/devices')
			.mergeMap((devices: IDbItem[]) => {
				return Observable.from(devices);
			})
			.map((device: IDbItem) => {
				return device.$key;
			})
			.switchMap(deviceName => {
				return this.db
					.list('/values/' + deviceName, { query: { orderByKey: true, limitToLast: 1 } })
					.map((values: IDbItem[]) => { return {deviceName: deviceName, values: values}; })
			})
			.subscribe(data => {
				var item = this.overviewData.find(item => item.name == data.deviceName)
				if (item) {
					this.dbValuesToMeasurement(item, data.values)
				} else {
					var newItem: IOverviewData = {name: data.deviceName, timestamp: new Date(), values: []};
					this.dbValuesToMeasurement(newItem, data.values);
					this.overviewData.push(newItem);
				}
				console.log("received overview data:", this.overviewData.map(i => i.name + "-" + i.timestamp.toJSON()));
			});
	}

	ngOnDestroy() {
		if (this.subscription) this.subscription.unsubscribe();
	}

	getIcon(measurement: string): string {
		switch (measurement) {
			case "temperature": return "thermometer";
			case "humidity": return "water";
			default: return "help";
		}
	}

	getUnit(measurement: string): string {
		switch (measurement) {
			case "temperature": return "°C";
			case "humidity": return "%";
			default: return "";
		}
	}

	getColor(measurement: string): string {
		switch (measurement) {
			case "temperature": return "danger";
			case "humidity": return "primary";
			default: return "dark";
		}
	}

	select(device) {
		console.log(device);
	}

	goto(device: IOverviewData, values: IMeasurement) {
		console.log(device, values);
		this.navCtrl.push(ChartPage, { device: device, measurement: values });
	}
}
