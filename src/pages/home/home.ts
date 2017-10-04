import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database'
import { Observable, Subscription } from 'rxjs'
import 'rxjs/add/operator/map'

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

	dbValuesToMeasurement(data: IOverviewData, dbValues: Object, timestamp: Date) {
		data.values.length = 0;
		data.timestamp = timestamp;

		Object.keys(dbValues).forEach(key => {
			data.values.push({measurement: key, value: dbValues[key]})
		})
	}

	ngOnInit() {
		this.db.list('/devices').snapshotChanges().mergeMap(devices => {
			return Observable.from(devices)
		}).map(device => {
			return device.key
		}).switchMap(deviceName => {
			return this.db.list('measures/' + deviceName + '/5seconds', ref => ref.orderByKey().limitToLast(1))
				.snapshotChanges()
				.filter(snapshot => snapshot.length > 0)
				.map(snapshot => {
					return {
						device: deviceName,
						timestamp: new Date(snapshot[0].key),
						values: snapshot[0].payload.val()
					}
				})
		}).subscribe(data => {
			console.log(data);
			var item = this.overviewData.find(item => item.name == data.device);
			if (item) {
				this.dbValuesToMeasurement(item, data.values, data.timestamp)
			} else {
				var newItem: IOverviewData = {name: data.device, timestamp: undefined, values: []};
				this.dbValuesToMeasurement(newItem, data.values, data.timestamp);
				this.overviewData.push(newItem);
			}
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

	goto(device: IOverviewData, values: IMeasurement) {
		console.log(device, values);
		this.navCtrl.push(ChartPage, { device: device, measurement: values });
	}

	format(date: Date) {
		var now = new Date();
		return now.getTime() - date.getTime();
	}
}
