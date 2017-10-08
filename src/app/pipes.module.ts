import { Pipe, PipeTransform, NgModule } from '@angular/core'

@Pipe({
	name: 'icon'
})
class IconPipe implements PipeTransform {
	transform(measurement: string): string {
		switch (measurement) {
			case "temperature": return "thermometer";
			case "temperature2": return "thermometer";
			case "humidity": return "water";
			case "co2": return "cloud";
			default: return "help";
		}
	}
}

@Pipe({
	name: 'color'
})
class ColorPipe implements PipeTransform {
	transform(measurement: string): string {
		switch (measurement) {
			case "temperature": return "danger";
			case "temperature2": return "danger";
			case "humidity": return "primary";
			default: return "dark";
		}
	}
}

@Pipe({
	name: 'unit'
})
class UnitPipe implements PipeTransform {
	transform(measurement: string): string {
		switch (measurement) {
			case "temperature": return "°C";
			case "temperature2": return "°C";
			case "humidity": return "%";
			case "co2": return " ppm";
			default: return "";
		}
	}
}

@Pipe({
	name: "niceName"
})
class NiceNamePipe implements PipeTransform {
	transform(measurement: string): string {
		switch (measurement) {
			case "temperature": return "Temperature";
			case "temperature2": return "Temperature (2)";
			case "humidity": return "Humidity";
			case "co2": return "CO\u2082";
			default: return "";
		}
	}
}

@NgModule({
	declarations: [IconPipe, ColorPipe, UnitPipe, NiceNamePipe],
	exports: [IconPipe, ColorPipe, UnitPipe, NiceNamePipe]
})
export class PipesModule { }
