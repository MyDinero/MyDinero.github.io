const version = 'v2';

//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var cacheName = 'sheets-cache';
var filesToCache = [
  '/index.html',
  '/history.html',
  '/style.css',
  '/history-javascript.js',
  '/javascript.js',
  '/icons/manifest.json',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/fonts/glyphicons-halflings-regular.woff2'
];

self.addEventListener('install', function(event) {
    console.log('SW %s installed at', version, new Date().toLocaleTimeString());
     event.waitUntil(
       caches.open(cacheName).then(function(cache) {
       console.log('[ServiceWorker] Caching app shell');
       return cache.addAll(filesToCache);
    })
  );
    
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('SW %s activated at', version, new Date().toLocaleTimeString());
    //event => event.waitUntil(self.clients.claim());it
});


self.addEventListener('fetch', function (event) {
   
         event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
});

self.addEventListener('sync', event => {
            if (event.tag === 'sync-transactions') {
                event.waitUntil(processSync());
            };
        });


       function processSync(){
           return new Promise((resolve, reject)=> {
                    var req = indexedDB.open('spreadsheets', 4)

                    req.onerror = console.error;

                    req.onsuccess = (event) => {

                        var db = event.target.result;
                        var transactions = db.transaction(['transactions'], 'readwrite').objectStore('transactions');
                        getData(transactions, t => t.isSync === false).then(data => {

                            //var transactions = db.transaction(['transactions'], 'readwrite').objectStore('transactions');

                            for (r of data) {
                                saveData(db, r);
                            }
                            
                            resolve();
                        });
                    };

                    //  });
                    //}
                }
       );
       };

       function saveData(db, r){
                                var payment = r.payment
                                var comment = r.comment;
                                var isOneTime = r.isOneTime;
                                var dailyPayment = isOneTime ? '' : payment;
                                var onePayment = isOneTime ? payment : '';
                                var date = r.date;

                                var url = "https://script.google.com/macros/s/AKfycbwkGDp_52AiTieJ-CRxR1UIqDShpcbJ-ovOrttH8ahP_FChwCY/exec?Komentaras=" + comment + "&Dieninis mokestis=" + dailyPayment + "&Vienkartinis mokestis=" + onePayment + "&Date=" + date;

                                fetch(url).then(res => {
                                    if (res.ok) {
                                        r.isSync = true;
                                        var tran = db.transaction(['transactions'], 'readwrite').objectStore('transactions').put(r);
                                        tran.onsuccess = () => {
                                           res.text().then(data => send_message_to_all_clients(data));
                                        };
                                        
                                        tran.onerror = (e) => { console.error(e)};
                                    }
                                });
       }

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

        function send_message_to_all_clients(msg) {
            clients.matchAll({
                includeUncontrolled: true,
                type: 'window'
            }).then(clients => {
                clients.forEach(client => {
                    send_message_to_client(client, msg);
                }, console.error)
            })
        }

        function send_message_to_client(client, msg) {
            // return new Promise(function (resolve, reject) {
            var msg_chan = new MessageChannel();

            //msg_chan.port1.onmessage = function (event) {
            //    if (event.data.error) {
            //        reject(event.data.error);
            //    } else {
            //        resolve(event.data);
            //    }
            //};

            client.postMessage(msg, [msg_chan.port2]);
            //});
        }