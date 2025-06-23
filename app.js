// API Configuration
const API_KEY = "95c1752da90f2fd186a13aa242dad553";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const ICON_URL = "https://openweathermap.org/img/wn/";

// DOM Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const currentWeather = document.getElementById("current-weather");
const forecast = document.getElementById("forecast");
const errorMessage = document.getElementById("error-message");
const loading = document.getElementById("loading");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const htmlElement = document.documentElement;

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || 
                      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    htmlElement.classList.add(savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    themeIcon.innerHTML = theme === "dark" ? 
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />` :
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`;
}

themeToggle.addEventListener("click", () => {
    const isDark = htmlElement.classList.contains("dark");
    if (isDark) {
        htmlElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        updateThemeIcon("light");
    } else {
        htmlElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        updateThemeIcon("dark");
    }
});

// Weather Data Functions
async function fetchWeatherByCity(city) {
    try {
        showLoading(true);
        clearError();

        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );

        if (!currentResponse.ok) {
            const errorData = await currentResponse.json();
            throw new Error(errorData.message || "Failed to fetch weather data");
        }

        const currentData = await currentResponse.json();
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error("Failed to fetch forecast data");
        }
        
        const forecastData = await forecastResponse.json();
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
    } catch (error) {
        showError(`Error: ${error.message}. Please check the city name and try again.`);
        console.error("API Error:", error);
    } finally {
        showLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading(true);
        clearError();

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayCurrentWeather(data) {
    document.getElementById("city-name").textContent = data.name;
    document.getElementById("country-code").textContent = data.sys.country;
    document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById("weather-description").textContent = data.weather[0].description;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("wind-speed").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;

    const weatherIcon = document.getElementById("weather-icon");
    weatherIcon.innerHTML = `<img src="${ICON_URL}${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" class="animate__animated animate__fadeIn">`;

    currentWeather.classList.remove("hidden");
    currentWeather.classList.add("animate__animated", "animate__fadeIn");
}

function displayForecast(data) {
    forecast.innerHTML = "";
    const dailyForecast = {};

    data.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
        if (!dailyForecast[date]) {
            dailyForecast[date] = item;
        }
    });

    Object.keys(dailyForecast).slice(0, 5).forEach((day) => {
        const dayData = dailyForecast[day];
        const date = new Date(dayData.dt * 1000);

        const forecastCard = document.createElement("div");
        forecastCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate__animated animate__fadeIn";
        forecastCard.innerHTML = `
            <h3 class="font-semibold text-gray-800 dark:text-white">${date.toLocaleDateString("en-US", { weekday: "short" })}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            <div class="flex justify-center my-2">
                <img src="${ICON_URL}${dayData.weather[0].icon}.png" alt="${dayData.weather[0].description}" class="w-12 h-12">
            </div>
            <div class="flex justify-between mt-2">
                <span class="font-bold text-gray-800 dark:text-white">${Math.round(dayData.main.temp_max)}°</span>
                <span class="text-gray-600 dark:text-gray-400">${Math.round(dayData.main.temp_min)}°</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 capitalize mt-1">${dayData.weather[0].description}</p>
        `;
        forecast.appendChild(forecastCard);
    });
}

// Helper Functions
function showLoading(show) {
    loading.classList.toggle("hidden", !show);
    if (show) {
        currentWeather.classList.add("hidden");
        forecast.innerHTML = "";
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
    errorMessage.classList.add("animate__animated", "animate__fadeIn");
}

function clearError() {
    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";
}

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError("Geolocation error: " + error.message);
            }
        );
    } else {
        showError("Geolocation is not supported by your browser");
    }
});

// Initialize
initializeTheme();
fetchWeatherByCity("London");