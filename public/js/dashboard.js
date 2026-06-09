const ctx = document.getElementById('myChart');

new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Check-Ed', 'Pending'],
    datasets: [{
      data: [12, 19],
      backgroundColor: [
        '#90ee90',
        '#e2e20c'
      ]
    }]
  }
});