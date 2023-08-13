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

NodeAjax.get<T>('https://our-request-api/resource').pipe(/* any operators you need ).subscribe();
```

Requests also have an options object we can pass in like so:

```
{
    headers?: Record<string, string>;
    contentType?: "json" | "text" | "form";
    timeout?: number;
    params?: Record<string, string | number | boolean>;
}
```

And for .patch, .put and .post our generics need to follow our body we place in like so:

```
interface ProfileData {
    username: string;
    avatar: string;
    bio: string;
    age: number;
}

// this will return Observable<ProfileData> //
NodeAjax.post<ProfileData>('https://our-request-api/resource', {
    username: 'JohnDoe',
    avatar: '',
    bio: 'John Doe, international man of mystery',
    age: 30
}).subscribe();
```
