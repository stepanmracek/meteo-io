import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';

interface IDbValue {
	humidity: number;
	temperature: number;
	$key: string;
	$exists: Function
}

export interface IChartData {
	labels: string[];
	data: {
		label: string;
		data: number[];
		lineTension: number;
	}[]
}

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage implements OnInit {

	dataset: IChartData = {
		labels: [],
		data: [{
			label: "temperature",
			data: [],
			lineTension: 0
		}]
	}

	labels: string[] = [];

	constructor(public navCtrl: NavController, private db: AngularFireDatabase) {
		for (var i = 0; i < 120; i++) {
			this.dataset.labels.push("    ");
		}
	}

	ngOnInit() {
		this.db.list('/meteo', {
			query: {
				orderByKey: true,
				limitToLast: 120,
			}
		}).subscribe((items: IDbValue[]) => {
			let dataset: IChartData = {
				labels: [],
				data: [{
					label: "temperature",
					data: [],
					lineTension: 0
				}]
			};

			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				let label = item.$key.substr(11).replace("-",":").replace("-",":");
				dataset.data[0].data.push(item.temperature);
				dataset.labels.push(label);
			}

			this.dataset = dataset;
		});
	}

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
