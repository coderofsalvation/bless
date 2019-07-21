# bless()
256 bytes mixin-alternative for ALL js frameworks in the world FOREVER: `function bless(💪)`

<img src="https://media.giphy.com/media/8mvV5eUXkM18iCm5Eg/giphy.gif" width="200"/>
Chainable, eventful, rewindable, typesafe, curryable mixins = bless()

| After being blessed  | Before                                                               |
|-----------------------------------------------|---------------------------------------------|
| <img src="https://i.imgur.com/qSmOGOr.png" width="85%"/> | ![](https://i.imgur.com/e1efhea.gif) |

> (b)less temporary variables, (b)less plumbing, less code 🤯

### Sourcecode 💗

```
var bless
bless = function(a){
    if( !a || a.unbless ) return a
    a.__proto__ = { __proto__: a.__proto__ }
    var prot = a.__proto__
    prot.mixin = (fn,f) => prot[fn] = f
    prot.unbless = () => { a.__proto__ = a.__proto__._p; return a; }
    for( var i in bless ) prot[i] = bless[i].bind(a,a)
    return a
}
// actual mixins are omitted in this snippet

var _ = bless // (optional) for underscore & lodash lovers 💗
```

## Install

* node.js / browser: download [bless.js](https://raw.githubusercontent.com/coderofsalvation/bless/master/bless.js)
* appscript: download [bless.gs](https://raw.githubusercontent.com/coderofsalvation/bless/master/bless.gs)

## API 👾

| function | returns | description |
|-|-|-|
| bless( myvar )  | bless | adds mixins + generates schema from data |
| myvar.valid(f)  | bless | checks if data violates the schema (if so, it'll call f) |
| myvar.rewind() | bless |  rewind data back to original data |
| myvar.schema()  | schema | export the (json) schema |
| myvar.get('foo.bar.flop',1) |  bless | shorthand for `if( myvar.foo && myvar.foo.bar && myvar.foo.bar.flop ){ .. }else{ .. }` plumbing |
| myvar.set('foo.bar.flop',5) | bless | creates `myvar.foo.bar.flop = 5` without plumbing |
| myvar.then( () => ... )     | bless | comfortable promise-like chaining |
| myvar.pluck(['foo'])        | bless | returns an object with the specified keys (`{foo:{..}}`) without plumbing |
| myvar.omit(['foo'])         | bless | returns an object without the specified keys (`{}`) without plumbing |
| myvar.clone()               | bless | returns a clone of the object |
| myvar.map( f )              | bless | maps over arrays or object-keys and calls `f(value,key)`|
| myvar.push( o )             | bless | pushes element to array (converts o to array if o is object) |
| myvar.each( (v,k) => .. )   | bless | iterates over arrays or object-keys |
| myvar.each( (v,k,next) => next() ) | promise | iterates over arrays or object-keys (asynchronous) |
| myvar.on(event,func)        | bless | adds eventlistener to event [string]  |
| myvar.emit(event,data)      | bless | forwards data to all .on(...) eventlisteners |
| myvar.unbless()             | original var | removes blessings (mixins) |

## How does it work?

The idea is to organize functions around data (data as a framework if you will).
Mixins give our data arms & legs 💪 🗲:

```
foo = {bar:1}                           // arrays, strings and functions can also be blessed
bless(foo)
var x = foo.get('foo.bar.flop.flap',3)  // will not crash on nonexisting key, but sets & defaults to 3
```

## Custom mixins:

```
function execute(a){
    console.log(a)
    return a
}
foo.mixin('execute',execute)            // only add to foo
bless.mixin('execute',execute)          // global mixin

foo.clone()
   .execute()                           // prints {bar:1} to the console
```

> now visit [140bytes](https://aishikaty.github.io/140bytes/) and add your own mixins.

## Objects? Arrays? Async? sync?

> `.each()` and `.map()` to rule em all

With blessed 💪 objects, you can `map()` and `.each()` both synchronously **and** asynchronously over Objects **and** Arrays:

```
var a = [1,2]
var b = {a:1,b:2}
bless(a)
bless(b)

a.each( (v,k) => console.log(k) )
b.each( (v,k) => console.log(k) )
a.each( (v,k,next) => console.log(k); next() )
```

> Byebye zillion ways to write async & sync loops, promises & async/await's


> Optionally you can copy/paste the bless-function above + `minified-mixins.js` (+1k) (below) in your project.

## Write features as mixins

```
// features
data.on('doBar',         (a) => console.log(3) ) // eventlistener
data.on('doBar:before',  (a) => console.log(1) ) // eventlistener
data.mixin('doBar',      (a) => console.log(2) ) // the actual function

data
.doBar(1) // outputs 1 2 3
.doBar(2) // outputs 1 2 3
```

Mixins allow us to write chainable, eventdriven & pluggable features (without the boilerplate).

> NOTE: with (eventdriven) power comes great responsibility


## Automagically eventdriven data

Turn data into event-busses like it's nothing.
Especially for animation-, creative-, hotpluggable- or multitenant-code this prevents headaches & many lines of code:
```

var d = {a:1}
bless(d)
var unbind = d.on('foo',() => console.log("foo! ") )
d.emit('foo',23423234)
// call unbind() when done

```

adding mixins will automatically add events (which promotes small function and pluggable features/code)

```
data.mixin('foo',     () => console.log(2) )
data.on('foo:before', () => console.log(1) )
data.on('foo:after',  () => console.log(3) )
data.foo() // outputs 1,2,3
```

Wait..how about debouncing certain events as well:

```
// add debouncer certain events
em.debounce = {'ui.update':300,'save':300}
bless.wrap( em, 'emit', (original,e,v) => {
    var d = em.debounce
    if( d[e] ){
        d.ids = d.ids || {}
        console.log("debouncing "+e)
        clearTimeout(d.ids[e])
        d.ids[e] = setTimeout( original, d[e], e, v)
    }else return original(e,v)
},em)
```

> easy peasy!

<link rel="stylesheet" href="README.css"/>
