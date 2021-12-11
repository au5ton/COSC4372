import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
import numpy as np
import cv2


class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    #response_body = list_servers(query["plex_token"])
    response_body = test()
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

class PlexServerDTO:
  name = str()
  server_uri_jws = str()
  server_token = str()
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def test():
  return 'hello'

if __name__ == "__main__":
  print(str(jsonpickle.encode(test(), indent=2)))