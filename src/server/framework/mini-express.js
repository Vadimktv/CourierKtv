const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function createApp() {
  const routes = [];
  const middlewares = [];

  const app = async (req, res) => {
    enhanceResponse(res);

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    req.path = decodeURIComponent(requestUrl.pathname);
    req.query = Object.fromEntries(requestUrl.searchParams.entries());
    req.params = {};

    try {
      req.rawBody = await collectBody(req);
    } catch (error) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }

    const stack = [...middlewares];
    const route = matchRoute(routes, req.method, req.path);
    if (route) {
      stack.push(route.handler);
      req.params = route.params || {};
    } else {
      stack.push((req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });
    }

    let index = 0;

    const next = (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ error: err.message || 'Server error' });
        }
        return;
      }

      const layer = stack[index++];
      if (!layer) {
        if (!res.headersSent) {
          res.end();
        }
        return;
      }

      try {
        if (layer.length >= 4) {
          // Skip error handlers in this lightweight version.
          next();
          return;
        }
        layer(req, res, next);
      } catch (error) {
        next(error);
      }
    };

    next();
  };

  app.use = (middleware) => {
    middlewares.push(middleware);
  };

  METHODS.forEach((method) => {
    app[method.toLowerCase()] = (routePath, handler) => {
      routes.push({ method, path: routePath, handler });
    };
  });

  app.listen = (port, callback) => {
    const server = http.createServer(app);
    return server.listen(port, callback);
  };

  return app;
}

function enhanceResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(data));
  };

  res.send = (data) => {
    if (Buffer.isBuffer(data)) {
      res.end(data);
      return;
    }
    if (typeof data === 'object') {
      res.json(data);
      return;
    }
    res.end(String(data));
  };
}

function matchRoute(routes, method, pathName) {
  const candidates = routes.filter((route) => route.method === method);
  for (const route of candidates) {
    const params = {};
    if (typeof route.path === 'string') {
      if (route.path === pathName) {
        return { ...route, params };
      }
      const tokens = route.path.split('/');
      const segments = pathName.split('/');
      if (tokens.length === segments.length) {
        let matched = true;
        for (let i = 0; i < tokens.length; i += 1) {
          const token = tokens[i];
          const segment = segments[i];
          if (token.startsWith(':')) {
            params[token.slice(1)] = segment;
          } else if (token !== segment) {
            matched = false;
            break;
          }
        }
        if (matched) {
          return { ...route, params };
        }
      }
    } else if (route.path instanceof RegExp) {
      const match = route.path.exec(pathName);
      if (match) {
        route.path.lastIndex = 0; // reset stateful regex
        return { ...route, params };
      }
    }
  }
  return null;
}

function collectBody(req) {
  if (req.rawBody) {
    return Promise.resolve(req.rawBody);
  }

  if (['GET', 'HEAD'].includes(req.method)) {
    return Promise.resolve(Buffer.alloc(0));
  }

  const limit = 1024 * 1024 * 25; // 25MB default limit
  let received = 0;
  const chunks = [];

  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > limit) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function parseLimit(value) {
  if (!value) {
    return 1024 * 1024; // 1MB default
  }
  if (typeof value === 'number') {
    return value;
  }
  const match = /^([0-9]+)\s*(kb|mb|gb)?$/i.exec(value.trim());
  if (!match) {
    return 1024 * 1024;
  }
  const size = parseInt(match[1], 10);
  const unit = (match[2] || 'b').toLowerCase();
  switch (unit) {
    case 'kb':
      return size * 1024;
    case 'mb':
      return size * 1024 * 1024;
    case 'gb':
      return size * 1024 * 1024 * 1024;
    default:
      return size;
  }
}

createApp.json = function jsonMiddleware(options = {}) {
  const limit = parseLimit(options.limit);
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return next();
    }

    if (req.rawBody.length > limit) {
      res.status(413).json({ error: 'JSON payload too large' });
      return;
    }

    if (req.rawBody.length === 0) {
      req.body = {};
      return next();
    }

    try {
      const text = req.rawBody.toString('utf8');
      req.body = text ? JSON.parse(text) : {};
      return next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  };
};

createApp.static = function staticMiddleware(rootDirectory) {
  const absoluteRoot = path.resolve(rootDirectory);
  return (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      return next();
    }

    const rawPath = req.path === '/' ? '/index.html' : req.path;
    const normalized = path.normalize(rawPath);
    const strippedTraversal = normalized.replace(/^(\.\.(?:[/\\]|$))+/, '');
    const safeRelativePath = strippedTraversal.replace(/^[/\\]+/, '');
    const filePath = path.join(absoluteRoot, safeRelativePath);
    if (!filePath.startsWith(absoluteRoot)) {
      res.status(403).send('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (req.path === '/' || req.path === '') {
          const indexPath = path.join(absoluteRoot, 'index.html');
          fs.readFile(indexPath, (readErr, data) => {
            if (readErr) {
              next();
              return;
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(data);
          });
        } else {
          next();
        }
        return;
      }

      if (stats.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        fs.readFile(indexPath, (readErr, data) => {
          if (readErr) {
            next();
            return;
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(data);
        });
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        next();
      });
      const extension = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[extension];
      if (mime) {
        res.setHeader('Content-Type', mime);
      }
      res.setHeader('Content-Length', stats.size);
      res.statusCode = 200;
      stream.pipe(res);
    });
  };
};

module.exports = createApp;
