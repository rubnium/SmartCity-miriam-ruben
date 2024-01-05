import L from 'leaflet';
import { Button, Grid, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import CircleIcon from '@mui/icons-material/Circle';

import PopupDesHabilitar from './PopupDesHabilitar';
import { CtxPopupProvider, ContextoPopup } from './ContextoPopup';
import api from '../../utils/api';
import gM from '../../utils/generalMap';
import '../../utils/Map.css';

const coloresLinea = ['black', 'brown', 'red', /*'orange',*/ 'yellow', 'green', 'cyan', 'blue', 'magenta', 'purple', 'gray', 'white', 'pink', 'turquoise', 'darkred', 'darkgreen', 'darkpurple', 'lightgray', 'palerose'];

const obtenerMarcadores = (tipo, setMarcadores, setDeshabilitados, setError) => {
  try {
    api.get('/paradas/'+ tipo + '/desh=0').then((res) => {
        setMarcadores(res.data);
    });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    setError(error.message || 'Error en la solicitud');
  }

  try {
    api.get('/paradas/'+ tipo +'/desh=1').then((res) => {
      setDeshabilitados(res.data);
    });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    setError(error.message || 'Error en la solicitud');
  }
};

function useDeshabilitarParada() {
  const { setMostrarPopup, setParada, setLinea, setModo } = useContext(ContextoPopup);

  function deshabilitar(linea, parada) {
    console.log("deshabilitada");
    setMostrarPopup(true);
    setParada(parada);
    setLinea(linea);
    setModo("deshabilitar");
  }

  return {
    deshabilitar
  }
}

function UseMap({ marcadores, marcadoresDesh, tipo }) {
  const map = useMap();
  const { deshabilitar } = useDeshabilitarParada();

	var zoom = gM.zoom;
	if (tipo === 'autobus') {
		zoom = zoom+1;
	} else if (tipo === 'cercanias') {
		zoom = zoom-1;
	} else if (tipo === 'interurbano') {
		zoom = zoom-2;
	}

  map.setView(gM.centro, zoom);
  L.tileLayer(gM.url).addTo(map);

  map.setMaxBounds(gM.limites);
  map.setMinZoom(gM.minZoom);
  map.options.bounceAtZoomLimits = false;

  const canvas = L.canvas();
  map.addLayer(canvas);

  useEffect(() => {    
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Path) {
          map.removeLayer(layer);
      }
    });

		const lineas = {}; //Almacena las coordenadas de los puntos para cada línea
    
    marcadores.forEach(marcador => {
			const {lat, lon, linea, parada} = marcador;

			const coordenadas = [lat, lon];

			if (lineas[linea]) {
				lineas[linea].push(coordenadas);
			} else {
				lineas[linea] = [coordenadas];
			}

      const marker = L.circleMarker([lat, lon], {
          renderer: canvas,
					radius: 5
      }).addTo(map).bindPopup(`<div style="text-align: center;">
				${linea}<br />
				${parada}<br />
        <a href="#" class="deshabilitar-link">Deshabilitar</a>
      </div>`);   

      marker.on('popupopen', () => {
        const deshabilitarLink = document.querySelector('.deshabilitar-link');
        deshabilitarLink.addEventListener('click', (event) => {
          event.preventDefault(); //Evitar que el enlace realice la acción por defecto (navegar a otra página)
          deshabilitar(linea, parada);
        });
      });
    });

		Object.keys(lineas).forEach((linea, index) => {
      const color = coloresLinea[index % coloresLinea.length];
			const polyline = L.polyline(lineas[linea], {color}).addTo(map);

			polyline.on('click', (event) => {
				const latlng = event.latlng;
				L.popup()
					.setLatLng(latlng)
					.setContent(`<div style="text-align: center;">Línea ${linea}</div>`)
					.openOn(map);
			});
		});

    marcadoresDesh.forEach(marcadorDesh => {
			const {lat, lon, linea, parada, motivo} = marcadorDesh;
      L.circleMarker([lat, lon], {
          renderer: canvas,
					radius: 4,
          color: 'orange'
      }).addTo(map).bindPopup(`<div style="text-align: center;">
				${linea}<br />
				${parada}<br />
        <i>${motivo}</i><br />
				<a href="#" class="habilitar-link">Habilitar</a>
      </div>`);   

    });
	}, [marcadores, marcadoresDesh]);

  return null;
}

const MapaParadas = (props) => {
  const { tipo } = props;
  const [marcadores, setMarcadores] = useState([]);
  const [paradasDeshabilitadas, setParadasDeshabilitadas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerMarcadores(tipo, setMarcadores, setParadasDeshabilitadas, setError);
  }, [tipo]);

  var mapSizeValues = [9,10] //tamaño del mapa si hay paradas deshabilitadas
  if (paradasDeshabilitadas.length === 0) {
    mapSizeValues = [12,12] //tamaño del mapa si no hay paradas deshabilitadas
  };

  return (
    <Grid item container xs={12}>
      {paradasDeshabilitadas.length > 0 && 
      <Grid item xs={12} md={3} lg={2}>
        <Typography variant="h6"><CircleIcon sx={{ fontSize: 20, verticalAlign: 'middle', marginRight: 1, color: 'orange' }}/>Paradas deshabilitadas</Typography>
        <ul>
        {paradasDeshabilitadas.map((parada, index) => (
          <li key={index}>
            {parada.parada}, linea {parada.linea}<br/>
            <i>{parada.motivo}</i>
            <Button variant="outlined" style={{ margin: '4px 8px', padding: '4px 8px', fontSize: '12px' }}>Habilitar</Button>
          </li>
        ))}
        </ul>
      </Grid>}
      <CtxPopupProvider>
      <Grid item xs={12} md={mapSizeValues[0]} lg={mapSizeValues[1]}>
        <MapContainer>
          <UseMap marcadores={marcadores} marcadoresDesh={paradasDeshabilitadas} tipo={tipo}/>
        </MapContainer>
      </Grid>
      <PopupDesHabilitar tipo={tipo}/>
      </CtxPopupProvider>
    </Grid>
  );
}

export default MapaParadas;
