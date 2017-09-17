# gun-react-native-sqlite

A Gun <> SQLite Adapter for React Native apps to enable long-term storage for Gun data.

## Installation

`npm install gun-react-native-sqlite --save` or `yarn add gun-react-native-sqlite`.

This module depends on `react-native-sqlite-storage` for SQLite bindings. Follow instructions [here](https://github.com/andpor/react-native-sqlite-storage#how-to-use-ios) to ensure that SQLite is installed and accessible.

## Run

```javascript
import Gun from './gun-rn/index';
import GunSQLite from './gun-react-native-sqlite/index';
const adapter = GunSQLite.bootstrap(Gun);

const gun = new Gun({

    // Defaults
    sqlite: {
        database_name: "GunDB.db",
        database_location: "default", // for concerns about location on iOS, see [here](https://github.com/andpor/react-native-sqlite-storage#opening-a-database)
        onOpen: () => {},
        onErr: err => {},
        onReady: err => {} // don't attempt to read/write from Gun until this has been called unless you like to live dangerously
    }
})
```

## Cleaning Up Old Data

Depending on your application, your graph data can grow in size and has the potential to overwhelm your DB storage size. 

The adapter provides a hook to clear out data that is older than a certain time:

```javascript
import GunSQLite from './gun-react-native-sqlite/index';
const adapter = GunSQLite.bootstrap(Gun);


// Do a whole bunch of stuff, load and store data, etc, etc

// Clear out anything older than 24 hrs from local storage
adapter.clean(Date.now() - (1000 * 60 * 60 * 24), err => {
    if (!err) {
        console.log("All cleaned up!");
    }
});
```

Assuming that you're storing this data somewhere else (like, on a server somewhere), this does not delete the data from Gun permanently; it just removes it from local storage.

## TODO

* Support `createFromLocation` option
* Android testing/support
* Performance profiling

## Compatibility

This has only been testing with iOS, but it should be compatible with Android. If using Android, please report any issues; even better, submit a PR.

## Other Options

If you're looking for long-term storage of your Gun database for React Native, you can also give the following a try:

* [AyncStorage](https://github.com/staltz/gun-asyncstorage)
* [Realm](https://github.com/sjones6/gun-realm)

## Contributions

Contributions welcome on [GitHub](https://github.com/sjones6/gun-react-native-sqlite). Especially, testing and compatibility work for all platforms.

## Issues

Issues welcome on [GitHub](https://github.com/sjones6/gun-react-native-sqlite).