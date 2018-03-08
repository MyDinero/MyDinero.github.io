var req = indexedDB.open('spreadsheets', 4)

req.onsuccess = evt => {
        var transactions = evt.target.result.transaction(['transactions'], 'readwrite').objectStore('transactions');
        
                        getData(transactions, 20).then(data => {

                            //var transactions = db.transaction(['transactions'], 'readwrite').objectStore('transactions');

                            var table = $('#table-body');

                            for (r of data) {
                                var payment = r.payment
                                var comment = r.comment;
                                var isOneTime = r.isOneTime;
                                var dailyPayment = isOneTime ? '' : payment;
                                var onePayment = isOneTime ? payment : '';
                                var date = r.date;
                                var color = r.isSync ? '' : 'bgcolor="#FFE5E5"';
                                
                                table.append('<tr ' + color +'><td>' + payment +' &euro;</td><td>'+comment+'</td><td>'+isOneTime+'</td><td>'+date+'</td></tr>');
                            }
                            
                            $('#loading').hide()
                          //  $('#loading').toggle()
                        });
    };    

  function getData(objectStore, length) {
            return new Promise((resolve, reject) => {
                var t = [];

                function onsuccess(evt) {
                    var cursor = evt.target.result;

                    if (cursor) {
                        //if (t.length < length) {
                            t.push(cursor.value);
                        //}
                        cursor.continue();
                    } else {
                        resolve(t.sort(function (a, b) { return b.timestamp - a.timestamp }).slice(0, length));
                    }
                }
                objectStore.openCursor().onsuccess = onsuccess;
            });
        }