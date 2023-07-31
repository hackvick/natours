const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations, 'll');

mapboxgl.accessToken =
  'pk.eyJ1Ijoidmlja3loYXNpamEiLCJhIjoiY2xrbnZjamczMjVkeTNmcnphaGRwaXBibSJ9.dDmOjphzv2EKo0PaOJNphw';

var map = new mapboxgl.Mao({
  container: 'map',
  style: 'mapbox://styles/vickyhasija/clknvnf5n00l501pc4mra327j'
});
