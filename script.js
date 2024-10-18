const apiKey = '25f5ddd2afd33aa2494c7540f811f2d8';
const defaultCities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
const alertThreshold = 35; // Celsius
let dailyData = [];

// Fetch weather data from OpenWeatherMap API
const fetchWeatherData = async (city) => {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        return {
            city: data.name,
            temp: (data.main.temp - 273.15).toFixed(2), // Convert to Celsius
            feels_like: (data.main.feels_like - 273.15).toFixed(2),
            main: data.weather[0].main,
            icon: data.weather[0].icon,
            dt: data.dt * 1000 // Convert Unix timestamp to milliseconds
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('City not found. Please try another city.');
    }
};

// Update weather data periodically
const updateWeather = async () => {
    const weatherPromises = defaultCities.map(city => fetchWeatherData(city));
    const weatherData = await Promise.all(weatherPromises);
    displayWeather(weatherData);
    calculateDailySummary(weatherData);
};

// Display weather data on the UI
const displayWeather = (weatherData) => {
    const currentWeather = weatherData[0]; // Display data for the first city
    document.getElementById('city-name').textContent = currentWeather.city;
    document.getElementById('temp').textContent = currentWeather.temp;
    document.getElementById('feels-like').textContent = currentWeather.feels_like;
    document.getElementById('main-condition').textContent = currentWeather.main;

    // Set weather icon
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${currentWeather.icon}.png`;
    document.getElementById('weather-icon').alt = currentWeather.main;

    // Change background color based on temperature
    changeBackgroundColor(currentWeather.temp);

    // Check for alert thresholds
    if (currentWeather.temp > alertThreshold) {
        addAlert(`Temperature in ${currentWeather.city} exceeds ${alertThreshold}°C`);
    }
};

// Change background color based on temperature
const changeBackgroundColor = (temp) => {
    const body = document.body;
    if (temp < 15) {
        body.style.backgroundColor = '#a0d3e8'; // Cool blue
    } else if (temp >= 15 && temp < 25) {
        body.style.backgroundColor = '#ffe4a1'; // Warm yellow
    } else if (temp >= 25 && temp < 35) {
        body.style.backgroundColor = '#ffcccb'; // Warm red
    } else {
        body.style.backgroundColor = '#ff6347'; // Hot orange
    }
};

// Add alerts to the UI
const addAlert = (message) => {
    const alertList = document.getElementById('alert-list');
    const alertItem = document.createElement('li');
    alertItem.textContent = message;
    alertItem.classList.add('text-danger');
    alertList.appendChild(alertItem);
};

// Calculate daily weather summary
const calculateDailySummary = (weatherData) => {
    const dailySummary = {
        averageTemp: 0,
        maxTemp: -Infinity,
        minTemp: Infinity,
        dominantCondition: ''
    };
    
    weatherData.forEach(data => {
        dailySummary.averageTemp += parseFloat(data.temp);
        dailySummary.maxTemp = Math.max(dailySummary.maxTemp, parseFloat(data.temp));
        dailySummary.minTemp = Math.min(dailySummary.minTemp, parseFloat(data.temp));
        // Determine dominant weather condition (first appearance)
        if (!dailySummary.dominantCondition) {
            dailySummary.dominantCondition = data.main;
        }
    });

    dailySummary.averageTemp /= weatherData.length; // Average temperature
    dailyData.push(dailySummary);
    
    // Update chart with new data
    updateChart(dailyData);
};

// Update the summary chart
const updateChart = (dailyData) => {
    const summaryChart = document.getElementById('summaryChart').getContext('2d');

    const avgTemps = dailyData.map(data => data.averageTemp);
    const labels = dailyData.map((_, index) => `Day ${index + 1}`);
    
    new Chart(summaryChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Average Temperature (°C)',
                data: avgTemps,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
};

// Add event listener for the search button
document.getElementById('search-btn').addEventListener('click', async () => {
    const cityName = document.getElementById('search-input').value;
    if (cityName) {
        const weatherData = await fetchWeatherData(cityName);
        if (weatherData) {
            displayWeather([weatherData]); // Display the weather for the searched city
        }
    }
});

// Fetch data every 5 minutes
setInterval(updateWeather, 300000);
updateWeather(); // Initial call
