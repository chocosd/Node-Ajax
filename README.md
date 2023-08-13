# Node-Rxjs-Ajax

If you enjoy working with RXJS and you've ever wanted to use it in an api you may notice there's some issues in node when you import `ajax` from RXJS - this package builds an alternative that still uses observables for its HTTP Client.

So this is a smallish implementation of Rxjs Ajax that works in node.

## Installation

```
$ npm install node-rxjs-ajax

```

## Usage

We can use our options object to build our http parts, simply import NodeAjax from the package like below, below is an example of a simple get request

```
import { NodeAjax } from 'node-rxjs-ajax';

NodeAjax({
    url: '',
    contentType: 'json',
    method: 'GET'
}).pipe(
    // add any operators you need
).subscribe((data) => {
    // do something with your data when subscribed
});

// a get request with a generic for our expected output

NodeAjax<expectedResponse>(
    // nodeAjax options
).pipe().subscribe();

```
