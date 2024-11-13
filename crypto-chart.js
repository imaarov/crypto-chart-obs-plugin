const urlParams = new URLSearchParams(window.location.search);
const coin = urlParams.get('coin') || 'bitcoin';
const theme = urlParams.get('theme') || 'dark';
const range = urlParams.get('range') || 'day';
const style = urlParams.get('style') || 'card'; // Added style for switching

// Set theme and styles
if (theme === 'dark') {
  document.documentElement.style.setProperty('--card-bg', '#2b2b3c');
  document.documentElement.style.setProperty('--text-color', '#ffffff');
  document.documentElement.style.setProperty('--price-color', '#ffffff');
  document.documentElement.style.setProperty('--capsule-bg', '#2b2b3c');
} else if (theme === 'light') {
  document.documentElement.style.setProperty('--card-bg', '#ffffff');
  document.documentElement.style.setProperty('--text-color', '#333333');
  document.documentElement.style.setProperty('--price-color', '#007acc');
  document.documentElement.style.setProperty('--capsule-bg', '#ffffff');
}

// Initialize chart
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

let lastPrice = null;

// Fetch price data
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

    if (style === 'capsule') {
      updateCapsuleStyle(latestPrice);
    }
  } catch (error) {
    console.error('Error fetching price data:', error);
  }
}

// Fetch coin icon
async function fetchCoinIcon() {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const data = await response.json();
    const iconUrl = data.image.small; // Get the URL for the icon
    document.getElementById('icon-img').src = iconUrl;
    document.getElementById('icon-img-capsule').src = iconUrl;
  } catch (error) {
    console.error('Error fetching coin icon:', error);
    document.getElementById('icon-img').alt = "Icon not found";
  }
}

// Update capsule view with price change and growth information
function updateCapsuleStyle(latestPrice) {
  const capsule = document.getElementById('capsule-display');
  const priceText = document.getElementById('current-price-capsule');
  const growthInfo = document.getElementById('growth-info-capsule');
  const icon = document.getElementById('coin-icon-capsule');

  // Show the capsule and hide the chart
  document.getElementById('priceChart').classList.add('hidden');
  document.getElementById('crypto-display').classList.add('hidden');
  capsule.classList.remove('hidden');

  const priceChange = latestPrice - lastPrice;
  const growthPercentage = ((priceChange / lastPrice) * 100).toFixed(2);

  if (priceChange > 0) {
    capsule.classList.add('green');
    capsule.classList.remove('red');
    priceText.textContent = `$${latestPrice.toFixed(2)} (+${growthPercentage}%)`;
    growthInfo.textContent = `+${growthPercentage}% (${priceChange.toFixed(2)} USD)`;
    growthInfo.classList.add('flash-up');
    growthInfo.classList.remove('flash-down');
  } else if (priceChange < 0) {
    capsule.classList.add('red');
    capsule.classList.remove('green');
    priceText.textContent = `$${latestPrice.toFixed(2)} (${growthPercentage}%)`;
    growthInfo.textContent = `${growthPercentage}% (${priceChange.toFixed(2)} USD)`;
    growthInfo.classList.add('flash-down');
    growthInfo.classList.remove('flash-up');
  } else {
    capsule.classList.remove('green', 'red');
    priceText.textContent = `$${latestPrice.toFixed(2)}`;
    growthInfo.textContent = '';
    growthInfo.classList.remove('flash-up', 'flash-down');
  }

  lastPrice = latestPrice;
}

fetchPriceData();
fetchCoinIcon();

if (range === 'day') {
  setInterval(fetchPriceData, 10000);
}

