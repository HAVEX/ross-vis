# ROSS-Vis

> A visual analytics application for exploring and analyzing performance data from the ROSS PDES engine.

## Requirement
Server backend requires Python version => 3.4

## Installation (Server and Client App)
```
git clone https://github.com/HAVEX/ross-vis-server
git clone https://github.com/HAVEX/ross-vis
```

### setup and run server
``` bash
cd ross-vis-server
pip install -r requirements.txt
```

## Start Server
For post-hoc analysis, a file containing the data with the ROSS-Damaris flatbuffers format can be used as the input.
To start the app server for listening HTTP and WebSocket requests on port 8888 and receiving data streams on port 8000:

```
python appserver.py --http=8888 --stream=8000 --test=1 --datafile=<path-to-file> --appdir=../ross-vis/dist
```

## Access the Client App
After the server is started with HTTP port = 8888, use a web browser to access the ROSS-Vis app at:

```
http://localhost:8888
```

## Documentation
For tutorials on how to use ROSS-Vis app for post-hoc and streaming-data analysis, please see the Wiki