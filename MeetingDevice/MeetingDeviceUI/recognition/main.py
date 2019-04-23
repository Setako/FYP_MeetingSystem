import click
import asyncio
from src import io, predict, camera
from multiprocessing import JoinableQueue, Queue
import rx, rx.operators as op
import cv2


@click.command()
@click.option(
    "-t",
    "--token",
    help="token that used to connect to web scoket server",
    required=True,
    type=str,
)
@click.option(
    "-p",
    "--port",
    help="port of local web socket server, default as 3000",
    default=3000,
    type=int,
)
def main(token, port: int):
    io.start(token, port)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
