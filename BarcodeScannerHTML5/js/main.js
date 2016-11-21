var app = angular.module('scanner', ['ngTouch']);

var fakeCodes = [
  'Something with \' 字 and other §hìtty char',
  'http://www.datalogic.com',
  'intent://scan/#Intent;package=com.google.zxing.client.android;scheme=zxing;end;',
  'http://www.themusiczoo.com/images/7-28-11/59_Flying_V_Korina_Ultra_Aged_911041_a.jpg',
  'https://f-droid.org/FDroid.apk'
];

var IMGS_EXT = [
  'png', 'jpg', 'jpeg', 'gif', 'svg'
];

var MIME_ICONS = {
  'image': 'image',
  'application': 'download',
};

MainCtrl = function($scope, $timeout, $sce) {

  var fakeScanTimer = null;

  $scope.store = [];

  $scope.onStart = function() {
    $scope.isScanning = true;
    $scope.goodRead = false;
  };

  $scope.onStop = function() {
    $scope.isScanning = false;
    if (fakeScanTimer) $timeout.cancel(fakeScanTimer);
  };

  $scope.onTimeout = function() {
    console.log('onTimeout');
    $scope.isScanning = false;
	  $scope.barcode = 'Timeout!';
    $scope.barcodeInfo = null;
	  $scope.goodRead = false;
  };

  $scope.onRead = function(code, symbology) {
    $scope.isScanning = false;
    handleBarcodeData(code);
  	$scope.barcodeInfo = symbology;

    // Show good read
    $scope.goodRead = true;
    $timeout(function() { $scope.goodRead = false; }, 500);

    $scope.store.unshift(code);
  };

  $scope.startScan = function(timeout) {
    if ($scope.isScanning)
      return;

    if (!timeout || timeout > 4500 || timeout < 0)
      timeout = 4500;

    BarcodeManager.startDecode(timeout);
  }

  $scope.stopScan = function() {
    BarcodeManager.stopDecode();
  }

  /**
   * Init a fake barcode scanner if a decoder is not available
   */
  if (!('BarcodeManager' in window)) {
    console.warn("Using a fake scanner");
    BarcodeManager = {

      startDecode: function(timeout) {
        $scope.onStart();
        fakeScanTimer = $timeout(function() {
            onRead(fakeCodes[Math.floor(Math.random() * fakeCodes.length)], 'EAN13');
        }, 1000);
      },

      stopDecode: function() {
        $scope.onStop();
      }
    };
  }

  $scope.showModal = function() {
    $scope.modalVisible = true;
  };

  $scope.hideModal = function () {
    console.log('hide modal');
    $scope.modalVisible = false;

    if ('MainSettings' in window)
      MainSettings.setOpen(false);
  }

  function handleBarcodeData(code) {
    $scope.barcode = null;
    $scope.type = null;
    $scope.url = null;
    $scope.www = null;
    $scope.mimeIcon = null;

    if (!code)
      return;

    var uri = new URI(code);

    /**
     * Barcode contains a URI
     */
    if (uri.getScheme()) {
        $scope.url = $sce.trustAsResourceUrl(code);

        switch (uri.getScheme()) {
        case 'http':
        case 'https':
          var path = uri.getPath();
          if (!path) {
            $scope.www = $scope.url;
            $scope.type = 'website';
            $scope.mimeIcon = 'external-link';
          } else {
            $scope.mime = getMimeType(path);
            if ($scope.mime) {
                $scope.type = $scope.mime.split('/')[0];
                $scope.mimeIcon = getMimeTypeIcon($scope.mime);
            }
          }
          break;

        case 'intent':
            $scope.mimeIcon = 'android';
            break;

        default:
            break;
        }
    } else {
        $scope.mimeIcon = null;
    }

    // HTML safe
    $scope.barcode = htmlEntities(code);
  }
};

app.controller('MainCtrl', [ '$scope', '$timeout', '$sce', MainCtrl ]);

window.onload = function() {

    VERSION = '0.0'
    if ('MainSettings' in window)
        VERSION = MainSettings.getAppVersion()

    var scope = angular.element('body').scope();
    onStart = scope.onStart;
    onRead = scope.onRead;
    onStop = scope.onStop;
    onTimeout = scope.onTimeout;

    // Good Read UI
    var goodRead = $('.good-read');
    var size = Math.min(goodRead.parent().height(), goodRead.parent().width()) / 2;
    goodRead.width(size);
    goodRead.height(size);
    goodRead.css('top', (goodRead.parent().height() - size) / 2 + 'px');
    goodRead.css('left', (goodRead.parent().width() - size) / 2 + 'px');

    settings = {};
};

function getMimeType(filename) {
  var ext = filename.split('.').pop();

  if (IMGS_EXT.indexOf(ext) >= 0) {
    return 'image';
  } else if (ext == 'apk') {
    return 'application/android';
  }
}

function getMimeTypeIcon(mime) {
  var type = mime.split('/')[0];
  return MIME_ICONS[type];
}

function htmlEntities(string) {
    return string.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    });
}
