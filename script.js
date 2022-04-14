var datumDo = getDate(new Date());
var datumOd = getDate(addDays(new Date(), 1));
const spinner = document.getElementById("spinner");
var doc_list = [];

function logout() {
  window.location.replace("index.html");
}

function vyplnLogin() {
  if (document.getElementById('zvolCus').value != "0") {
    const myArray = document.getElementById('zvolCus').value.split(":")
    document.getElementById('cusKey').value = myArray[0];
    document.getElementById('cusSec').value = myArray[1];
  } else {
    const myArray = document.getElementById('zvolCus').value.split(":")
    document.getElementById('cusKey').value = "";
    document.getElementById('cusSec').value = "";
  }
}

function getDate(date) {
  var mm = date.getMonth() + 1;
  var dd = date.getDate();

  return [date.getFullYear(),
  (mm > 9 ? '' : '0') + mm,
  (dd > 9 ? '' : '0') + dd
  ].join('-');
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function login() {
  var input = document.getElementById('cusKey').value + ':' + document.getElementById('cusSec').value;
  var url = "https://my.api.gw-world.com/token";
  var data = "grant_type=client_credentials&scope=API_CUSTNT_ORDERS_STATUS_READ API_CUSTNT_PACKAGES_STATUS_READ API_DOCUMENTS_READ";
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader("Authorization", "Basic " + btoa(input));
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    // Process our return data
    if (xhr.status >= 200 && xhr.status < 300) {
      // Runs when the request is successful
      token = JSON.parse(xhr.response).access_token;
      expires_in = JSON.parse(xhr.response).expires_in;
      console.log(JSON.parse(xhr.response));
      document.getElementById("menu").style.visibility = "visible";
      document.getElementById("login").innerHTML = "";
      document.getElementById("footer").innerHTML = "";
      document.getElementById("obsah_col_1").innerHTML = "";
      document.getElementById("tokenSpan").innerHTML = 'Uzivatel prihlasen<br>zivotnost tokenu ' + expires_in + 's <br>' + token;
      document.getElementById("container").style.gridTemplateRows = "100px 0fr 150px 100px 100px;"
      document.getElementById("container").style.gridAutoRows = "0fr";
      showStatuses();

    } else {
      // Runs when it's not
      document.getElementById("tokenSpan").innerHTML = 'Uzivatel neprihlasen<br>spatne customer key nebo secret?';
    }
  };
  xhr.send(data);
}

function showStatuses(startindex = 1) {
  var url = "https://my.api.gw-world.com/common/trackntrace/1.0.2/orders/current-status?dateFrom=" + datumOd + "&dateTo=" + datumDo + "&calculateETA=false&startIndex=" + startindex + "&pageSize=50";
  var data = "grant_type=client_credentials&scope=API_CUSTNT_ORDERS_STATUS_READ API_CUSTNT_PACKAGES_STATUS_READ";
  var xhr = new XMLHttpRequest();
  document.getElementById("obsah_col_1").innerHTML = '<br><span id="spinner"></span>';
  document.getElementById('idDelivery').value = '';
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("accept-language", "cs-CZ");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    // Process our return data
    document.getElementById("footer").innerHTML = '<div id="pagination" class="pagination"></div>';
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log('Response:');
      // Runs when the request is successful
      data = JSON.parse(xhr.response);
      console.log(JSON.parse(xhr.response));
      //document.getElementById("footer").innerHTML += '<br>Celkovy pocet zasilek od '+datumOd + " do "+datumDo+" je "+ data.pagination.totalRows;   
      if (data.pagination.totalPages > 1) {
        for (let page = 0; page < data.pagination.totalPages; page++) {
          document.getElementById("pagination").innerHTML += '<a href="javascript:void(0);" onclick="showStatuses(startindex=' + (page * 50) + ');">' + (page + 1) + '</a>';
        }
      }
      let pole = [];
      // document.getElementById("footer").innerHTML = '<div id="pagination" class="pagination"></div>';

      for (var i in data.orderStatusList) {
        var obj = {
          id: i,
          GW_cislo: '<a href="javascript:void(0);" onclick="showDelivery(' + data.orderStatusList[i].orderReferenced.orderId + ');">' + data.orderStatusList[i].orderReferenced.orderId + '</a>',
          customer_id: data.orderStatusList[i].orderReferenced.customerId,
          // GW_cislo: data.orderStatusList[i].orderReferenced.orderId,
          reference: data.orderStatusList[i].orderReferenced.references[0].reference,
          reference_2: (data.orderStatusList[i].orderReferenced.references[2] !== undefined ? data.orderStatusList[i].orderReferenced.references[2].reference : "NoN"),
          datum: new Date(data.orderStatusList[i].orderReferenced.creationDate).toLocaleDateString(),
          // duvod: (data.orderStatusList[i].orderStatusCurrent.eventReason !== undefined ? data.orderStatusList[i].orderStatusCurrent.eventReason.translationResolved.text : "NoN"),
          // lokace: data.orderStatusList[i].orderStatusCurrent.location.location,  
          Track_n_Trace_URL: '<a href="https://my.gw-world.com/trackntrace/-/search/CZ/' + data.orderStatusList[i].orderReferenced.orderId + '" target="_blank">Sleduj zasilku na Track and Trace GW</a>',
          stav: (data.orderStatusList[i].statusCurrent !== undefined ? data.orderStatusList[i].statusCurrent.eventDescription.translationResolved.text : "NoN")
        }
        pole.push(obj);
      }
      // console.log('POLE' + pole);
      createTable(pole);
      showGraph();

    } else {
      // Runs when it's not
      document.getElementById("obsah_col_1").innerHTML = 'Zadna data k zobrazeni';
      document.getElementById("footer").innerHTML = '<div id="pagination" class="pagination"></div>';
    }
  };
  xhr.send(data);

}

function showDocuments(startindex = 1) {
  var url = "https://my.api.gw-world.com/common/document/3.0.0/orders/documents?dateFrom=" + datumOd + "&dateTo=" + datumDo + "&startIndex=" + startindex + "&pageSize=50";
  var data = "grant_type=client_credentials&scope=API_CUSTNT_ORDERS_STATUS_READ API_CUSTNT_PACKAGES_STATUS_READ API_DOCUMENTS_READ";
  var xhr = new XMLHttpRequest();
  document.getElementById("obsah_col_1").innerHTML = '<br><span id="spinner" class="center"></span>';
  document.getElementById('idDelivery').value = '';
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("accept-language", "cs-CZ");
  xhr.setRequestHeader("accept", "application-json");
  xhr.onload = function () {
    // Process our return data
    document.getElementById("footer").innerHTML = '<div id="pagination" class="pagination"></div>';
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log('Response:');
      // Runs when the request is successful
      data = JSON.parse(xhr.response);
      console.log(JSON.parse(xhr.response));
      if (data.pagination.totalPages > 1) {
        for (let page = 0; page < data.pagination.totalPages; page++) {
          document.getElementById("pagination").innerHTML += '<a href="javascript:void(0);" onclick="showDocuments(startindex=' + (page * 50) + ');">' + (page + 1) + '</a>';
        }
      }
      let pole = [];
      for (var i in data.orderDocumentList) {
        let doc_list = [];
        var obj = {
          ID: i,
          GW_cislo: data.orderDocumentList[i].orderReferenced.orderId,
          datum: new Date(data.orderDocumentList[i].orderReferenced.creationDate).toLocaleDateString(),
          dokumenty: doc_list
        }
        pole.push(obj);
        for (var doc in data.orderDocumentList[i].documents) {
          var carovy_kod = '<a href="javascript:void(0);" onclick="getDocument(\'' + data.orderDocumentList[i].documents[doc]._links.url + '\');">' + data.orderDocumentList[i].documents[doc].docType + '</a>';
          doc_list.push(carovy_kod);
        }
      }
      createTable(pole);
    } else {
      // Runs when it's not
      document.getElementById("obsah_col_1").innerHTML = 'Zadna data k zobrazeni';
    }
  };
  xhr.send(data);
}

function getDocument(url) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if ((xhr.status == 200) || (xhr.status == 0)) {
        var a = document.createElement('a');
        a.href = window.URL.createObjectURL(xhr.response); // xhr.response is a blob
        var attr = document.createAttribute("download");
        a.setAttributeNode(attr);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    }
  };
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.send();
}

function showDelivery(delID) {
  document.getElementById("footer").innerHTML = '<div id="pagination" class="pagination"></div>';
  if (document.getElementById('idDelivery').value !== '') {
    delID = document.getElementById('idDelivery').value;
  }
  document.getElementById('idDelivery').value = delID;
  document.getElementById("footer").innerHTML = '';
  var url = "https://my.api.gw-world.com/common/trackntrace/1.0.2/orders/" + delID + "/packages/status?startIndex=1&pageSize=10";
  var data = "grant_type=client_credentials&scope=API_CUSTNT_ORDERS_STATUS_READ API_CUSTNT_PACKAGES_STATUS_READ API_DOCUMENTS_READ";
  var xhr = new XMLHttpRequest();
  document.getElementById("obsah_col_1").innerHTML = '<br><span id="spinner" class="center"></span>';
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("accept-language", "cs-CZ");
  xhr.setRequestHeader("accept", "application-json");
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log('Response:');
      // Runs when the request is successful
      data = JSON.parse(xhr.response);
      console.log(JSON.parse(xhr.responseText));
      var seznam_bc = [];
      var obj = {
        GW_cislo: data.orderReferenced.orderId,
        reference: data.orderReferenced.references[0].reference,
        reference_2: (data.orderReferenced.references[2] !== undefined ? data.orderReferenced.references[2].reference : "NoN"),
        datum: new Date(data.orderReferenced.creationDate).toLocaleDateString(),
        Track_n_Trace_URL: '<a href="https://my.gw-world.com/trackntrace/-/search/CZ/' + delID + '" target="_blank">Sleduj zasilku na Track and Trace GW</a>',
        stav: (data.orderStatusCurrent.eventDescription !== undefined ? data.orderStatusCurrent.eventDescription.translationResolved.text : "NoN"),
        duvod: (data.orderStatusCurrent.eventReason !== undefined ? data.orderStatusCurrent.eventReason.translationResolved.text : "NoN"),
        lokace: data.orderStatusCurrent.location.location,
        barcode: seznam_bc,
        dokumenty: '<div id="dokumenty" class="flex_gap"></div>'
      }
      let pole = [];
      getListOfDocuments(data.orderReferenced.orderId);
      for (var pack in data.packages) {
        var carovy_kod = data.packages[pack].packageReferenced.barcode[0].barcode;
        seznam_bc.push('<a href=https://barcode.tec-it.com/barcode.ashx?data=' + carovy_kod + '&code=EANUCC128&translate-esc=on" target="_blank"><img src="../docs/bar_code.png" alt="' + carovy_kod + '" width="20" height="20"> </a>');
      }
      pole.push(obj);
      document.getElementById("obsah_col_1").innerHTML = 'Detailni info o zasilce ' + delID;
      createTable(pole);
      doc_list=[];
    } else {
      // Runs when it's not
      document.getElementById("obsah_col_1").innerHTML = 'Zasilka cislo "' + delID + '" neexistuje.';
      document.getElementById('idDelivery').value = '';
      doc_list=[];
    }
  };
  xhr.send(data);
}

function getListOfDocuments(delID) {
  var url = "https://my.api.gw-world.com/common/document/3.0.0/orders/" + delID + "/documents";
  var data;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.setRequestHeader("accept", "application-json");
  xhr.setRequestHeader("accept-language", "de-DE");
  xhr.setRequestHeader("Authorization", "Bearer "+token);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);

      data = JSON.parse(xhr.response);
      for (var doc in data.documents) {
        var carovy_kod = '<a href="javascript:void(0);" onclick="getDocument(\'' + data.documents[doc]._links.url + '\');"><img src="../docs/pdf_icon.png" alt="'+data.documents[doc].docType+'" width="20" height="20"></a>';
        doc_list.push(carovy_kod);
        document.getElementById('dokumenty').innerHTML += carovy_kod;
      }
    }
  };
  xhr.send();
  return doc_list;
}

function showGraph() {
  var url = "https://my.api.gw-world.com/common/trackntrace/1.0.2/orders/current-status?dateFrom=" + datumOd + "&dateTo=" + datumDo + "&calculateETA=false&startIndex=1&pageSize=50";
  var data = "grant_type=client_credentials&scope=API_CUSTNT_ORDERS_STATUS_READ API_CUSTNT_PACKAGES_STATUS_READ";
  var xhr = new XMLHttpRequest();
  document.getElementById("obsah_col_2").innerHTML = "";
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("accept-language", "cs-CZ");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    // Process our return data
    if (xhr.status >= 200 && xhr.status < 300) {
      // Runs when the request is successful
      data = JSON.parse(xhr.response);
      //console.log(JSON.parse(xhr.response));
      var dataGraf2 = {
        OPEN: 0,
        IN_PROGRESS: 0,
        ATTENTION: 0,
        CRITICAL: 0,
        COMPLETED: 0,
        celkem: 0
      };

      var dataGraf = {
        delivered: 0,
        inTransit: 0,
        undelivered: 0,
        neznamyStav: 0,
        celkem: 0
      };
      dataGraf.celkem = data.orderStatusList.length;


      for (var i in data.orderStatusList) {

        var obj = {
          ID: i,
          GW_cislo: data.orderStatusList[i].orderReferenced.orderId,
          reference: data.orderStatusList[i].orderReferenced.references[0].reference,
          stav: (data.orderStatusList[i].statusCurrent !== undefined ? data.orderStatusList[i].statusCurrent.eventDescription.translationOriginal.text : "NoN")
        }
        // console.log(obj.stav);

        switch (obj.stav) {
          case 'arrival time at consignee / shipper':
            dataGraf.inTransit += 1;
            break;
          case 'picked up':
            dataGraf.inTransit += 1;
            break;
          case 'in Transit':
            dataGraf.inTransit += 1;
            break;
          case 'in delivery':
            dataGraf.inTransit += 1;
            break;
          case 'unloaded':
            dataGraf.inTransit += 1;
            break;
          case 'delivered':
            dataGraf.delivered += 1;
            break;
          case 'NoN':
            dataGraf.neznamyStav += 1;
            break;
          default:
            dataGraf.undelivered += 1;
        }
      }
    
      document.getElementById("obsah_col_2").innerHTML += '<div id="graf" style=" width: 300px;margin: auto align: center;"><canvas id="myChart"></canvas><p>Celkem zasilek: ' + dataGraf.celkem + '</p></div>';

      const config = {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Chart.js Pie Chart'
            }
          }
        },
      };


      const ctx = document.getElementById('myChart');
      const myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Doruceno', 'V preprave', 'Nedoruceno', 'Neznamy stav'],
          datasets: [{
            // label: '# zasilek',
            data: [dataGraf.delivered, dataGraf.inTransit, dataGraf.undelivered, dataGraf.neznamyStav],

            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 206, 86, 0.2)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 206, 86, 0.2)'
            ],
            borderWidth: 1
          }]
        }, options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Dle stavu zasilek'
            }
          }
        }
      });


    } else {
      // Runs when it's not
      document.getElementById("obsah_col_2").innerHTML = 'Zadne data k zobrazeni...';
    }
  };
  xhr.send(data);
}

function createTable(json) {
  document.getElementById("obsah_col_1").innerHTML += "";

  //tady vrati tabulku z JSONU
  var col = [];
  for (var i = 0; i < json.length; i++) {
    for (var key in json[i]) {
      if (col.indexOf(key) === -1) {
        col.push(key);
      }
    }
  }

  // CREATE DYNAMIC TABLE.
  var table = document.createElement("table");
  table.className = 'styled-table';
  // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
  var tr = table.insertRow(-1); // TABLE ROW.
  for (var i = 0; i < col.length; i++) {
    var th = document.createElement("th"); // TABLE HEADER.
    th.innerHTML = col[i];
    tr.className = "neco";
    tr.appendChild(th);
  }

  // ADD JSON DATA TO THE TABLE AS ROWS.
  for (var i = 0; i < json.length; i++) {
    tr = table.insertRow(-1);
    for (var j = 0; j < col.length; j++) {
      var tabCell = tr.insertCell(-1);
      tabCell.innerHTML = json[i][col[j]];
    }
  }
  // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
  document.getElementById('obsah_col_1').replaceChildren(table);
  document.getElementById('obsah_col_2').innerHTML = "";

}

