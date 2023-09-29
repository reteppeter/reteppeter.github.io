import taxBrackets from "./taxBrackets.json" assert { type: "json" };
import medicareLevy from "./medicareLevy.json" assert { type: "json" };

main();

async function main(){
	let isPerWeek = document.getElementById("isPerWeek");
	let includeMyki = document.getElementById("includeMyki");
	let isMykiPrepaid = document.getElementById("isMykiPrepaid");
	let wantedIncomeSetter = document.getElementById("wantedIncomeSetter");
	
	let hourlyWageOutput = document.getElementById("hourlyWageOutput");
	let dailyWageOutput = document.getElementById("dailyWageOutput");
	let weeklyWageOutput = document.getElementById("weeklyWageOutput");
	let yearlyWageOutput = document.getElementById("yearlyWageOutput");

	isPerWeek.addEventListener("change", (event) => { redraw(); });
	includeMyki.addEventListener("change", (event) => { redraw(); });
	isMykiPrepaid.addEventListener("change", (event) => { redraw(); });
	wantedIncomeSetter.addEventListener("change", (event) => { redraw(); });
	

	let isPerWeek2 = document.getElementById("isPerWeek2");
	let salarySetter = document.getElementById("salarySetter");

	let hourlyWageOutput2 = document.getElementById("hourlyWageOutput2");
	let dailyWageOutput2 = document.getElementById("dailyWageOutput2");
	let weeklyWageOutput2 = document.getElementById("weeklyWageOutput2");
	let yearlyWageOutput2 = document.getElementById("yearlyWageOutput2");
	
	isPerWeek2.addEventListener("change", (event) => { redraw(); });
	salarySetter.addEventListener("change", (event) => { redraw(); });

	const delay = ms => new Promise(res => setTimeout(res, ms));
	
	let moneyFormat = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", roundingMode:"halfEven" });
	
	let previousBracket = {equivalentMin:0, min:0, percent:0, alreadyPaidTax:0};
	
	for(let bracket of taxBrackets.brackets){
		bracket.equivalentMin = previousBracket.equivalentMin + (bracket.min - previousBracket.min) * (1 - previousBracket.percent - medicareLevy.value);
		bracket.alreadyPaidTax = previousBracket.alreadyPaidTax + (bracket.min - previousBracket.min) * previousBracket.percent;
		previousBracket = bracket;
		console.log(bracket);
	}
	
	let redraw = async function(){
		//Determine visibilities
		{
			isMykiPrepaid.hidden = !includeMyki.checked;
		}
		
		const weeksPerYear = 52;
		const hoursPerDay = 8;
		const daysPerWeek = 5;
		const daysPerYear = 52;
		const yearlyToWeekly = 1 / weeksPerYear;
		const yearlyToDaily = 1 / daysPerWeek / weeksPerYear;
		const yearlyToHourly = 1 / daysPerWeek / weeksPerYear / hoursPerDay;
		
		let wantedIncome = Number(wantedIncomeSetter.value);

		let totalIncome = wantedIncome;

		if(isPerWeek.checked){
			// const hoursPerDay = 8;
			// const daysPerWeek = 5;
			// const hoursPerWeek = hoursPerDay * daysPerWeek;
			// totalIncome	= wantedIncome * hoursPerWeek;
			
			const weeksPerYear = 52;
			totalIncome = wantedIncome * weeksPerYear;
		}
		
		if(includeMyki.checked){
			if(isMykiPrepaid.checked){
				totalIncome += 6 * 325;
			} else{
				totalIncome += 10 * (365 * 5.0/7.0);
			}
		}
		
		{
			let previousBracket = {equivalentMin:0, min:0, percent:0};
			for(let bracket of taxBrackets.brackets){
				if(bracket.equivalentMin > totalIncome){ break; }
				previousBracket = bracket;
			}
			
			let neededYearlyWage = (totalIncome - previousBracket.equivalentMin) / (1 - previousBracket.percent - medicareLevy.value) + previousBracket.min;
			
			let medicareTax = neededYearlyWage * medicareLevy.value;
			let incomeTax = neededYearlyWage - totalIncome - medicareTax;
			
			hourlyWageOutput.innerHTML = "Hourly: " + moneyFormat.format(neededYearlyWage * yearlyToHourly);
			dailyWageOutput.innerHTML = "Daily: " + moneyFormat.format(neededYearlyWage * yearlyToDaily);
			weeklyWageOutput.innerHTML = "Weekly: " + moneyFormat.format(neededYearlyWage * yearlyToWeekly);
			yearlyWageOutput.innerHTML = "Yearly: " + moneyFormat.format(neededYearlyWage) + ", " + moneyFormat.format(incomeTax) + ", " + moneyFormat.format(medicareTax);
		}
		
		
		
		let totalSalary = Number(salarySetter.value);

		let finalSalary = totalSalary;

		if(isPerWeek2.checked){
			finalSalary = totalSalary * weeksPerYear;
		}
		
		{
			let previousBracket = {equivalentMin:0, min:0, percent:0};
			for(let bracket of taxBrackets.brackets){
				if(bracket.equivalentMin > finalSalary){ break; }
				previousBracket = bracket;
			}
			
			let medicareTax = finalSalary * medicareLevy.value;
			let incomeTax = previousBracket.alreadyPaidTax + (finalSalary - previousBracket.min) * previousBracket.percent;
			
			let finalWage = finalSalary - incomeTax - medicareTax
			
			hourlyWageOutput2.innerHTML = "Hourly: " + moneyFormat.format(finalWage * yearlyToHourly);
			dailyWageOutput2.innerHTML = "Daily: " + moneyFormat.format(finalWage * yearlyToDaily);
			weeklyWageOutput2.innerHTML = "Weekly: " + moneyFormat.format(finalWage * yearlyToWeekly);
			yearlyWageOutput2.innerHTML = "Yearly: " + moneyFormat.format(finalWage) + ", " + moneyFormat.format(incomeTax) + ", " + moneyFormat.format(medicareTax);
		}
	};

	redraw();
};