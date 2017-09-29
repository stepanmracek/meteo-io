import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { BehaviorSubject, Subscription } from 'rxjs'
import 'rxjs/add/operator/map'

import { IDbItem } from '../../app/interfaces';

interface IChartData {
	labels: string[];
	data: {
		label: string;
		data: number[];
		lineTension: number;
	}[]
}

@Component({
	selector: 'chart-home',
	templateUrl: 'chart.html'
})
export class ChartPage implements OnInit, OnDestroy {

	deviceName: string;
	measurement: string;
	timespan: number = 120;
	timespanSubject: BehaviorSubject<number> = new BehaviorSubject<number>(this.timespan);
	subscription: Subscription = null;

	constructor(navParams: NavParams, private db: AngularFireDatabase) {
		var params = navParams.data;
		this.deviceName = params.device.name;
		this.measurement = params.measurement.measurement;
	}

	ngOnInit() {
		this.subscription = this.timespanSubject
			.switchMap(timespan => {
				console.log("getting last", timespan, "values");
				return this.db.list('/values/' + this.deviceName, {
					query: {
						orderByKey: true,
						limitToLast: timespan,
					}
				});
			}).subscribe((items: IDbItem[]) => {
				let data = [{
					label: this.measurement,
					data: [],
					lineTension: 0
				}];

				this.dataset.labels.length = 0;
				var modulo = Math.floor(Math.log(items.length));
				if (modulo < 1) modulo = 1;
				for (var i = 0; i < items.length; i++) {
					if (i % modulo != 0) continue;

					var item = items[i];
					let label = new Date(item.$key).toLocaleTimeString();
					data[0].data.push(item[this.measurement]);
					this.dataset.labels.push(label);
				}
				console.log("got", items.length, "values; modulo is ", modulo, "-> filtered to ", data[0].data.length, "values");

				this.dataset.data = data;
			});
	}

	ngOnDestroy() {
		if (this.subscription) this.subscription.unsubscribe();
	}

	onTimespanChange(newValue) {
		this.timespanSubject.next(newValue);
	}

	dataset: IChartData = {
		labels: [],
		data: [{
			label: this.measurement,
			data: [],
			lineTension: 0
		}]
	}

	labels: string[] = [];

	// lineChart
	public lineChartOptions: any = {
		responsive: true,
		animation: {
			duration: 0, // general animation time
		},
		hover: {
			animationDuration: 0, // duration of animations when hovering an item
		},
		responsiveAnimationDuration: 0, // animation duration after a resize
	};
	public lineChartColors: Array<any> = [
		{ // grey
			backgroundColor: 'rgba(148,159,177,0.2)',
			borderColor: 'rgba(148,159,177,1)',
			pointBackgroundColor: 'rgba(0,0,0,0)',
			pointBorderColor: 'rgba(0,0,0,0)',
			pointHoverBackgroundColor: 'rgba(0,0,0,0)',
			pointHoverBorderColor: 'rgba(0,0,0,0)',
		},
		{ // dark grey
			backgroundColor: 'rgba(77,83,96,0.2)',
			borderColor: 'rgba(77,83,96,1)',
			pointBackgroundColor: 'rgba(77,83,96,1)',
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: 'rgba(77,83,96,1)'
		},
		{ // grey
			backgroundColor: 'rgba(148,159,177,0.2)',
			borderColor: 'rgba(148,159,177,1)',
			pointBackgroundColor: 'rgba(148,159,177,1)',
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: 'rgba(148,159,177,0.8)'
		}
	];
}