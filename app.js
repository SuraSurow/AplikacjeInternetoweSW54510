const input = document.getElementById("city-input");
const btn = document.getElementById("weather-btn");

const openweathermapApiKey = "0f88c1de4993ef8b924824252a723c2c";

const currentWeatherBox = document.querySelector(".current-weather");
const forecastBox = document.querySelector(".forecast");

btn.addEventListener("click", () => {
    const query = input.value.trim();

    if (query === "") {
        alert("Proszę wpisać miasto lub adres!");
        return;
    }

    console.log("Wyszukiwanie pogody dla:", query);

    getCurrentWeather(query);
    getForecast(query);
});

function getCurrentWeather(city) {
  const xmlHttpRequest = new XMLHttpRequest();
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openweathermapApiKey}&units=metric&lang=pl`;

}

function getForecast(city) {
}
