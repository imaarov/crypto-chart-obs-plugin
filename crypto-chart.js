const urlParams = new URLSearchParams(window.location.search);
const coin = urlParams.get('coin') || 'bitcoin';
const theme = urlParams.get('theme') || 'dark';
const range = urlParams.get('range') || 'day';

if (theme === 'dark') {
  document.documentElement.style.setProperty('--card-bg', '#2b2b3c');
  document.documentElement.style.setProperty('--text-color', '#ffffff');
  document.documentElement.style.setProperty('--price-color', '#00cc99');
} else if (theme === 'light') {
  document.documentElement.style.setProperty('--card-bg', '#ffffff');
  document.documentElement.style.setProperty('--text-color', '#333333');
  document.documentElement.style.setProperty('--price-color', '#007acc');
}

const ctx = document.getElementById('priceChart').getContext('2d');
const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: `${coin.charAt(0).toUpperCase() + coin.slice(1)} Price (USD)`,
      backgroundColor: theme === 'dark' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)',
      borderColor: theme === 'dark' ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
      data: [],
      pointRadius: 0,
      fill: false,
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: range === 'day' ? 'hour' : range === 'week' ? 'day' : 'month',
          displayFormats: { hour: 'HH:mm', day: 'MMM d', month: 'MMM yyyy' }
        },
        ticks: { maxTicksLimit: 6 },
        title: { display: true, text: 'Time', color: 'var(--text-color)' }
      },
      y: {
        title: { display: true, text: 'Price (USD)', color: 'var(--text-color)' },
        beginAtZero: false
      }
    },
    plugins: {
      legend: { labels: { color: 'var(--text-color)' } }
    }
  }
});

async function fetchPriceData() {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365}`);
    const data = await response.json();
    
    const prices = data.prices.map(entry => ({
      time: new Date(entry[0]),
      price: entry[1]
    }));
    
    priceChart.data.labels = prices.map(p => p.time);
    priceChart.data.datasets[0].data = prices.map(p => p.price);
    priceChart.update();
    
    const latestPrice = prices[prices.length - 1].price;
    document.getElementById('current-price').textContent = `$${latestPrice.toFixed(2)}`;
  } catch (error) {
    console.error('Error fetching price data:', error);
  }
}

async function fetchCoinIcon() {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const data = await response.json();
    const iconUrl = data.image.small; // Get the URL for the icon
    document.getElementById('icon-img').src = iconUrl;
  } catch (error) {
    console.error('Error fetching coin icon:', error);
    document.getElementById('icon-img').alt = "Icon not found";
  }
}

fetchPriceData();
fetchCoinIcon();

if (range === 'day') {
  setInterval(fetchPriceData, 10000);
}

