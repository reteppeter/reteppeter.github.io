const { default: medicareLevy } = await import("./medicareLevy.json", { assert: { type: "json" } })
const { default: taxBrackets } = await import("./taxBrackets.json", { assert: { type: "json" } })

main();

async function main(){
	let payPeriodSelector = document.getElementById("payPeriodSelector");
	let includeMyki = document.getElementById("includeMyki");
	let isMykiPrepaid = document.getElementById("isMykiPrepaid");
	let incomeSetter = document.getElementById("incomeSetter");
	let incomeSetterSaver = document.getElementById("incomeSetterSaver");
	let beforeOrAfterTax = document.getElementById("beforeOrAfterTax");

	let ContainerMykiStuff = document.getElementById("ContainerMykiStuff");
	let ContainerAddTax = document.getElementById("ContainerAddTax");
	let ContainerRemoveTax = document.getElementById("ContainerRemoveTax");
	
	let hourlyWageOutput = document.getElementById("hourlyWageOutput");
	let dailyWageOutput = document.getElementById("dailyWageOutput");
	let weeklyWageOutput = document.getElementById("weeklyWageOutput");
	let yearlyWageOutput = document.getElementById("yearlyWageOutput");
	let yearlyTaxOutput = document.getElementById("yearlyTaxOutput");
	let yearlyMedicareOutput = document.getElementById("yearlyMedicareOutput");

	let ThenField = document.getElementById("ThenField");

	payPeriodSelector.addEventListener("change", (event) => { redraw(); });
	includeMyki.addEventListener("change", (event) => { redraw(); });
	isMykiPrepaid.addEventListener("change", (event) => { redraw(); });
	incomeSetter.addEventListener("change", (event) => { redraw(); });

	//incomeSetter.addEventListener("focus", (event) => { incomeSetter.value = incomeSetterSaver.value; });

	let isBefore = false;

	let updateVisibilityBeforeOrAfterTax = function(){
		let choice = beforeOrAfterTax.value;
		isBefore = choice === "before";

		// ContainerAddTax.hidden = isBefore;
		// ContainerRemoveTax.hidden = !isBefore;
		ContainerMykiStuff.hidden = isBefore;
	};

	updateVisibilityBeforeOrAfterTax();

	beforeOrAfterTax.addEventListener("change", (event) => {
		updateVisibilityBeforeOrAfterTax();
		redraw(); 
	});

	const delay = ms => new Promise(res => setTimeout(res, ms));
	
	let moneyFormat = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", roundingMode:"halfEven" });
	
	let previousBracket = {equivalentMin:0, min:0, percent:0, alreadyPaidTax:0};
	
	for(let bracket of taxBrackets.brackets){
		bracket.equivalentMin = previousBracket.equivalentMin + (bracket.min - previousBracket.min) * (1 - previousBracket.percent - medicareLevy.value);
		bracket.alreadyPaidTax = previousBracket.alreadyPaidTax + (bracket.min - previousBracket.min) * previousBracket.percent;
		previousBracket = bracket;
	}
	
	let redraw = async function(){
		const monthsPerYear = 12;
		const weeksPerYear = 52;
		const hoursPerDay = 8;
		const daysPerWeek = 5;
		const daysPerYear = weeksPerYear * daysPerWeek;
		const hoursPerYear = daysPerYear * hoursPerDay;
		const yearlyToWeekly = 1 / weeksPerYear;
		const yearlyToDaily = 1 / daysPerWeek / weeksPerYear;
		const yearlyToHourly = 1 / daysPerWeek / weeksPerYear / hoursPerDay;

		let income = Number(incomeSetter.value);
		incomeSetterSaver.value = income;

		if(payPeriodSelector.value === "hourly"){
			income = income * hoursPerYear;
		}else if(payPeriodSelector.value === "daily"){
			income = income * daysPerYear;
		}else if(payPeriodSelector.value === "weekly"){
			income = income * weeksPerYear;
		}else if(payPeriodSelector.value === "monthly"){
			income = income * monthsPerYear;
		}

		//incomeSetter.value = moneyFormat.format(income);

		if(!isBefore){
			ThenField.innerHTML = "Then, before tax you have to make:";

			//Determine visibilities
			{
				isMykiPrepaid.hidden = !includeMyki.checked;
			}

			let totalIncome = income;
			
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
				
				let neededYearlyWage = Math.max((totalIncome - previousBracket.equivalentMin) / (1 - previousBracket.percent - medicareLevy.value) + previousBracket.min, 0);
				
				let medicareTax = Math.max(neededYearlyWage * medicareLevy.value, 0);
				let incomeTax = Math.max(neededYearlyWage - totalIncome - medicareTax, 0);
				
				hourlyWageOutput.innerHTML = "Hourly: " + moneyFormat.format(neededYearlyWage * yearlyToHourly);
				dailyWageOutput.innerHTML = "Daily: " + moneyFormat.format(neededYearlyWage * yearlyToDaily);
				weeklyWageOutput.innerHTML = "Weekly: " + moneyFormat.format(neededYearlyWage * yearlyToWeekly);
				yearlyWageOutput.innerHTML = "Yearly: " + moneyFormat.format(neededYearlyWage);
				yearlyTaxOutput.innerHTML = "Tax: " + moneyFormat.format(incomeTax);
				yearlyMedicareOutput.innerHTML = "Medicare costs: " + moneyFormat.format(medicareTax);
			}
		} else{
			ThenField.innerHTML = "Then, after tax you make:";

			let finalSalary = income;
			
			{
				let previousBracket = {equivalentMin:0, min:0, percent:0};
				for(let bracket of taxBrackets.brackets){
					if(bracket.equivalentMin > finalSalary){ break; }
					previousBracket = bracket;
				}
				
				let medicareTax = Math.max(finalSalary * medicareLevy.value, 0);
				let incomeTax = Math.max(previousBracket.alreadyPaidTax + (finalSalary - previousBracket.min) * previousBracket.percent, 0);
				
				let finalWage = Math.max(finalSalary - incomeTax - medicareTax, 0);
				
				hourlyWageOutput.innerHTML = "Hourly: " + moneyFormat.format(finalWage * yearlyToHourly);
				dailyWageOutput.innerHTML = "Daily: " + moneyFormat.format(finalWage * yearlyToDaily);
				weeklyWageOutput.innerHTML = "Weekly: " + moneyFormat.format(finalWage * yearlyToWeekly);
				yearlyWageOutput.innerHTML = "Yearly: " + moneyFormat.format(finalWage);
				yearlyTaxOutput.innerHTML = "Tax: " + moneyFormat.format(incomeTax);
				yearlyMedicareOutput.innerHTML = "Medicare costs: " + moneyFormat.format(medicareTax);
			}
		}
	};

	redraw();
};