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

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${openweathermapApiKey}&units=metric&lang=pl`;

  xmlHttpRequest.open("GET", url);

  xmlHttpRequest.onload = function () {
      if (xmlHttpRequest.status === 200) {
          const data = JSON.parse(xmlHttpRequest.responseText);  
          console.log("Teraz Pogoda : ", data);
          currentWeatherBox.innerHTML = `
              <h2>Pogoda</h2>
              <p>Miasto: ${data.name}</p>
              <p>Temperatura: ${data.main.temp} °C</p>
              `
              ;
      } else {
          currentWeatherBox.innerHTML = `<p> nie udalo sie zaladowac pogody </p>`;
      }
  };

  xmlHttpRequest.onerror = function () {
      currentWeatherBox.innerHTML = `<p>error.</p>`;
  };

  xmlHttpRequest.send();
}




function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${openweathermapApiKey}&units=metric&lang=pl`;

  fetch(url)
      .then(response => {
          if (!response.ok) {
              throw new Error(`blad : ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          console.log("Pogoda 5 dniowa :", data);

          let daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
          if (daily.length === 0) {
              daily = data.list.slice(0, 5);
          }

          let html = `
              <h2>Prognoza 5-cio dniowa</h2>
              <table border="1" cellpadding="6" style="width:100%; border-collapse: collapse;">
                  <tr>
                      <th>Data</th>
                      <th>Temperatura (°C)</th>
                  </tr>
          `;

          daily.forEach(item => {
              const time = item.dt_txt;
              const temp = item.main.temp;
              html += `
                  <tr>
                      <td>${time}</td>
                      <td>${temp}</td>
                  </tr>
              `;
          });

          html += "</table>";

          forecastBox.innerHTML = html;
      })
      .catch(error => {
          console.error("Forecast error:", error);
          forecastBox.innerHTML = `<p>Blad przy zaladowaniu pogody .</p>`;
      });
}



