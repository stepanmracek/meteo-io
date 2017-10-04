import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { BehaviorSubject, Subscription } from 'rxjs';
import 'rxjs/add/operator/map';

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

	tenMinutes = 600;
	hour = 3600;
	sixHours = 21600;
	day = 86400;

	deviceName: string;
	measurement: string;
	timespan: number;
	timespanSubject: BehaviorSubject<number>;
	subscription: Subscription = null;

	constructor(navParams: NavParams, private db: AngularFireDatabase) {
		var params = navParams.data;
		this.timespan = this.tenMinutes;
		this.timespanSubject = new BehaviorSubject<number>(this.timespan);
		this.deviceName = params.device.name;
		this.measurement = params.measurement.measurement;
	}

	private getQueryInterval(timespan: number): string {
		switch (timespan) {
			case this.tenMinutes: return '5seconds';
			case this.hour: return 'minute';
			case this.sixHours: return '10minutes';
			case this.day: return '30minutes';
		}
	}

	ngOnInit() {
		this.subscription = this.timespanSubject
			.switchMap(timespan => {
				var date = new Date();
				date.setSeconds(date.getSeconds() - timespan);
				console.log("getting values from last", timespan, "seconds, starting at", date.toJSON());
				return this.db.list('/measures/' + this.deviceName + '/' + this.getQueryInterval(timespan),
					ref => ref.orderByKey().startAt(date.toJSON()).limitToLast(timespan))
					.snapshotChanges()
					.map(items => { return { items: items }; });
			}).subscribe(result => {
				console.log("received", result.items.length, "values");
				let data = [{
					label: this.measurement,
					data: [],
					lineTension: 0
				}];

				this.dataset.labels.length = 0;
				var startDate = new Date();
				startDate.setSeconds(startDate.getSeconds() - this.timespan);
				for (var i = 0; i < result.items.length; i++) {
					var item = result.items[i];
					var key = new Date(item.key);
					if (key < startDate) continue;

					let label = key.toLocaleTimeString();
					data[0].data.push(item.payload.val()[this.measurement]);
					this.dataset.labels.push(label);
				}
				console.log("filtered to", data[0].data.length, "values");

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