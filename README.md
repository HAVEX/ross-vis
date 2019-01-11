# ROSS-Vis

A visual analytics application for exploring and analyzing performance data from the ROSS PDES engine.

## Requirement
Server backend requires Python version >= 3.5

## Installation (Server and Client App)
``` bash
git clone https://github.com/HAVEX/ross-vis-server
git clone https://github.com/HAVEX/ross-vis
```

### setup and run server

Virtualenv is recommended for running the server backend: 
```
virtualenv -p python3 venv
source venv/bin/activate
```


``` bash
cd ross-vis-server
pip install -r requirements.txt
```

For post-hoc analysis, a file containing the data with the ROSS-Damaris flatbuffers format can be used as the input.
To start the app server for listening HTTP and WebSocket requests on port 8888 and receiving data streams on port 8000:

``` bash
python server.py --http=8888 --datafile=<path-to-file> --appdir=../ross-vis/dist
```

## Access the Client App
After the server is started with HTTP port = 8888, use a web browser to access the ROSS-Vis app at:

```
http://localhost:8888
```

## Real-time and Streaming Data
(coming soon)