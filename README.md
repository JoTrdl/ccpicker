ccpicker
========

CC Picker - Another HTML5 color picker

## Features
Touch and click compatible. Tested on Chrome / Safari / iOS.

## How to use it
Create a container in your DOM :
`<div id="picker" style="position:relative; width:600px; height:600px;">`

And initialize it :
`
CCPicker(document.getElementById('picker'), {
  callback: function(color) {
    console.log(color);
  }
});
`

If you prefer to use with jQuery :
`
$('#picker').ccpicker().on('change', function(e, color) {
  console.log(color);
});
`

See index.html for sample.
