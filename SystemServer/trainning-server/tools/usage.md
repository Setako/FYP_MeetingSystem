# Traniner
```
Usage: trainer.py [OPTIONS] MEETING_ID USERNAME_LIST...

Options:
  --server-root DIRECTORY      The root path of the server
  --resource-root DIRECTORY    The root path of the resource
  --model-save-path DIRECTORY  The directory where the model will be stored
  --user-image-path DIRECTORY  The directory with user image subdirectory
  --help                       Show this message and exit.
```


# Predictor

```
Usage: predictor.py [OPTIONS] MEETING_ID

Options:
  -d, --display-window  Enables display windows
  -v, --verbose         Enables verbose mode
  -s, --stop-when-done  Stop predicting when everyone was investigated
  --help                Show this message and exit.
```
