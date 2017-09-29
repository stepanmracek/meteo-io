import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
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
export class HomePage implements OnInit, OnDestroy {

	overviewData: IOverviewData[] = [];
	overviewSubscription: Subscription = null;
	timestampSubscription: Subscription = null;
	formattedTimestamp: { [deviceName: string]: string } = {};

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
		this.overviewSubscription = this.db
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
					var now = new Date();
					var newItem: IOverviewData = {name: data.deviceName, timestamp: now, values: []};
					this.dbValuesToMeasurement(newItem, data.values);
					this.overviewData.push(newItem);
				}
				console.log("received overview data:", this.overviewData.map(i => i.name + "-" + i.timestamp.toJSON()));
			});

		this.timestampSubscription = Observable.interval(500).subscribe(() => {
			var now = new Date();
			this.overviewData.forEach(d => {
				var seconds = Math.floor((now.getTime() - d.timestamp.getTime()) / 1000);
				if (seconds < 0) seconds = 0;

				var minutes = seconds / 60;
				var hours = minutes / 60;
				var days = hours / 24;

				if (seconds <= 10)
					this.formattedTimestamp[d.name] = "now";
				else if (seconds < 60)
					this.formattedTimestamp[d.name] = seconds.toFixed(0) + " seconds ago";
				else if (minutes < 60)
					this.formattedTimestamp[d.name] = minutes.toFixed(0) + " minutes ago";
				else if (hours < 24)
					this.formattedTimestamp[d.name] = hours.toFixed(0) + " hours ago";
				else
					this.formattedTimestamp[d.name] = days.toFixed(0) + " days ago";
			})
		});
	}

	ngOnDestroy() {
		if (this.overviewSubscription) this.overviewSubscription.unsubscribe();
	}

	getIcon(measurement: string): string {
		switch (measurement) {
			case "temperature": return "thermometer";
			case "temperature2": return "thermometer";
			case "humidity": return "water";
			case "co2": return "cloud";
			default: return "help";
		}
	}

	getUnit(measurement: string): string {
		switch (measurement) {
			case "temperature": return "°C";
			case "temperature2": return "°C";
			case "humidity": return "%";
			case "co2": return " ppm";
			default: return "";
		}
	}

	getColor(measurement: string): string {
		switch (measurement) {
			case "temperature": return "danger";
			case "temperature2": return "danger";
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

	format(date: Date) {
		var now = new Date();
		return now.getTime() - date.getTime();
	}
}
