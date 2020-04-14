// Author: soliforte
// Email: soliforte@protonmail.com
// Git: gitlab.com/soliforte
// Freeware, enjoy. If you do something really cool with it, let me know. Pull requests encouraged

(
    typeof define === "function" ? function (m) { define("plugin-macaddrlist-js", m); } :
    typeof exports === "object" ? function (m) { module.exports = m(); } :
    function(m){ this.macaddrlist = m(); }
  )(function () {

    "use strict";

    var exports = {};
    exports.load_complete = 0;
    $(document).ready(function(){

      var MACADDRS = []
      var devices = []
      var aps = []
      var clients = []

      var table = new Tabulator("#macaddrlist-table", {
        layout:"fitColumns",
        groupBy:["name","bssid"],
          columns:[
              {title:"MAC", field:"mac", sorter:"string", align:"right"},
              {title:"SSID", field:"name", sorter:"string"},
              {title:"Nickname", field:"nickname",sorter:"string"},
              {title:"BSSID", field:"bssid", sorter:"string", align:"right"},
              {title:"Encryption", field:"crypt", sorter:"string", align:"center"},
              {title:"Type", field:"type", sorter:"string", align:"right"},
              {title:"Client Count", field:"count", sorter:"number"},
              {title:"Signal", field:"signal", sorter:"number"},
              {title:"Channel", field:"channel", sorter:"number"},
          ],
      });

      $("#download-pdf").click(function(){
        table.download("pdf", "Wifi-Report.pdf", {
            orientation:"landscape", //set page orientation to portrait
            title:"802.11 Devices List", //add title to report
        });
      });

      $('#download-csv').click(function(){
        table.download("csv", "WiFi-Report.csv")
      })

      $('#addmacaddrbutton').on("click", function(){
        var addmacaddr = $('#addmacaddr').val();
        MACADDRS.push(addmacaddr);
        buildSSIDList(MACADDRS);
        $('#addmacaddr').val('');
      })

      // remove MACADDRS
      $('body').on("click",".removessid", function(){
        // get the value from the custom data attribute
        var id = $(this).data('ssindex');
        MACADDRS.splice(id,1);
        // update the list
        buildSSIDList(MACADDRS);
      });

      function buildSSIDList(MACADDRS){
        // clear the ssid label div and remove button
        $('#ssidsarea div').remove();
        $('#ssidsarea button').remove();
        // rebuild the list based on the items of the MACADDRS array
        $.each(MACADDRS, function(index, MACADDRS){
          $('#ssidsarea').append('<div class="ssid">'+MACADDRS+'</div><button class="removessid" data-ssindex="'+index+'">X</button>');
        });
      }

      $('#runreport').on("click", function(){
          getBMACADDRS();
      })

      function getBMACADDRS(){
        var clitotal = 0
        $.getJSON('/devices/last-time/0/devices.json').done(function(devs){
          for (var x in devs){
            var type = devs[x]['kismet.device.base.type']
            var crypt = devs[x]['kismet.device.base.crypt']
            var SSID = devs[x]['kismet.device.base.commonname']
            var key = devs[x]['kismet.device.base.key']
            var MAC = devs[x]['kismet.device.base.macaddr']
            var BSSID = devs[x]['dot11.device']['dot11.device.last_bssid']
            var signal = devs[x]['kismet.device.base.signal']['kismet.common.signal.last_signal']
            var channel = devs[x]['kismet.device.base.channel']
            var clientlist = Object.keys(devs[x]['dot11.device']['dot11.device.associated_client_map'])
            var clientcount = devs[x]['dot11.device']['dot11.device.num_associated_clients']
            for (var y in MACADDRS){
              if ( MACADDRS[y] == MAC){
                console.log('Found a match: ', MACADDRS[y])
                console.log('Clientlist:', clientlist.length)
                clitotal = clitotal + clientlist.length
                aps.push({'id':key,'name':SSID,'bssid':BSSID,'crypt':crypt,'mac':MAC,'type':type,'count':clientcount, 'signal': signal,'channel':channel})
                getClients(SSID, BSSID, crypt, key, clitotal)
              }
            }
          }
        })
      }

      function getClients(ssid, bssid, crypt, key, clitotal){
        console.log("getting clients for ", ssid)
        $.getJSON('/phy/phy80211/clients-of/'+key+'/clients.json').done(function(clis){
          for (var y in clis){
            var type = clis[y]['kismet.device.base.type']
            var nickname = clis[y]['kismet.device.base.commonname']
            var key = clis[y]['kismet.device.base.key']
            var MAC = clis[y]['kismet.device.base.macaddr']
            var signal = clis[y]['kismet.device.base.signal']['kismet.common.signal.last_signal']
            var channel = clis[y]['kismet.device.base.channel']
            console.log("adding client: ", nickname, MAC)
            clients.push({'id':key,'name':ssid,'nickname':nickname,'bssid':bssid,'crypt':crypt,'mac':MAC,'type':type,'count':0, 'signal':signal, 'channel':channel})
          }
          console.log("clients length:", clients.length)
          console.log("clients total:", clitotal)
          populateTable()
        })
      }

    function populateTable(){
      console.log('populating table')
      console.log('aps:', aps.length)
      console.log('clients:', clients.length)
      devices = aps.concat(clients)
      console.log('total:', devices.length)
      table.setData(devices)
      console.log('table should have populated??')
    }

  })

// Add to the sidebar
// Prevent "ReferenceError: kismet_ui_sidebar is not defined" on plugin/macaddrlist/index.html
// What's a better way to do this?
var len = $('script[src*="kismet.ui.sidebar.js"]').length;

if(len>0){
  kismet_ui_sidebar.AddSidebarItem({
      id: 'sidebar_macaddrlistlink',
      listTitle: '<i class="fa fa-gear" /> Report Gen',
      clickCallback: function() {
      window.open('/plugin/macaddrlist/', '_blank');
      }
  });
}

exports.load_complete = 1;
  return exports;
});
