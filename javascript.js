function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return yyyy + '-' + mm + '-' + dd;
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

//$('#indication').hide()

$( document ).ready(function() {
    var target = $('#payment')[0];

    target.focus();
    target.click();
    
    setTimeout(function(){ var target = $('#payment')[0];

    target.focus();
    target.click(); }, 10000);
});



var req = indexedDB.open('spreadsheets', 4)

 req.onupgradeneeded = function (event) {
        var db = event.target.result;

        if (event.oldVersion !== 0 && event.oldVersion !== 4) {
            db.deleteObjectStore("transactions");
        }

        var objectStore = db.createObjectStore("transactions", { keyPath: "key" });
        var dataStore = db.createObjectStore("data", { keyPath: "key" });
    };

req.onerror = console.error;

req.onsuccess = (event) => {

    var db = event.target.result;
    var transactions = db.transaction(['transactions'], 'readwrite').objectStore('transactions');
    getData(transactions, t => t.isSync === false).then(data => {
        var l = data.length;
        if (l > 0) {
            $('#indicationValue')[0].innerHTML = l;
            $('#indication').show();
        }
    });

    var data = db.transaction(['data'], 'readwrite').objectStore('data');

    getData(data, t => true).then(data => {
        var l = data.length;
        if (l > 0) {
            var json = data[0];
            $('#predictedValue')[0].innerHTML = json.predicted;
            $('#totalValue')[0].innerHTML = json.total;
            $('#regularAverageValue')[0].innerHTML = json.regularAverage;
            $('#onetimeAverageValue')[0].innerHTML = json.onetimeAverage;
        }
    });
};

function getData(objectStore, predicate) {
    return new Promise((resolve, reject) => {
        var t = [];
        function onsuccess(evt) {
            var cursor = evt.target.result;

            if (cursor) {
                if (predicate(cursor.value)) {
                    t.push(cursor.value);
                }
                cursor.continue();
            } else {
                resolve(t);
            }
        }
        objectStore.openCursor().onsuccess = onsuccess;
    });
}

if('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register("sw.js")
        .then(msg => console.log("SW registered"))
        .catch(console.error)

    navigator.serviceWorker.addEventListener('message', function (event) {
        console.log("Client 1 Received Message: " + event.data);
        $('#indicationValue')[0].innerHTML = Number($('#indicationValue')[0].innerHTML) - 1;

        var data = JSON.parse(event.data);
        $('#predictedValue')[0].innerHTML = data.predicted;
        $('#totalValue')[0].innerHTML = data.total;
        $('#regularAverageValue')[0].innerHTML = data.regularAverage;
        $('#onetimeAverageValue')[0].innerHTML = data.onetimeAverage;

        data.key = 1;
        var req = indexedDB.open('spreadsheets', 4)

        req.onerror = console.error;

        req.onsuccess = (event) => {
            var db = event.target.result;
            var tran = db.transaction(['data'], 'readwrite').objectStore('data').put(data);
            tran.onsuccess = () => {
                console.log("data saved");
            };

            tran.onerror = (e) => { console.error(e) };
        }
    });
}
    
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function sendData(){

    var req = indexedDB.open('spreadsheets', 4);

    req.onupgradeneeded = function (event) {
        var db = event.target.result;
        db.deleteObjectStore(transactions)
        var objectStore = db.createObjectStore("transactions", { keyPath: "key" });
        var dataStore = db.createObjectStore("data", { keyPath: "key" });
    };

    req.onsuccess = evt => {
        var transactions = evt.target.result.transaction(['transactions'], 'readwrite').objectStore('transactions');
        var val = {
            key: guid(),
            isSync: false,
            payment: $("#payment").val(),
            comment: $("#comment").val(),
            isOneTime: $("#fancy-checkbox-default")[0].checked,
            date: getDate(),
            timestamp: Date.now()
        };

        $("#payment").val('');
        $("#fancy-checkbox-default")[0].checked = false;
        $("#comment").val('');

        var operation = transactions.put(val);

        operation.onsuccess = () => {
            navigator.serviceWorker.ready.then(sw => {
                return sw.sync.register('sync-transactions').then((evt) => {
                    $('#indicationValue')[0].innerHTML = Number($('#indicationValue')[0].innerHTML) + 1;
                    $('#indication').show();
                    return evt;
                });
            });
        };      
    };    
}