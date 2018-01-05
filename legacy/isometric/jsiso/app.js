   require([
                'jsiso/canvas/Control',
                'jsiso/canvas/Input',
                'jsiso/img/load',
                'jsiso/json/load',
                'jsiso/tile/Field',
                'jsiso/pathfind/pathfind',
                'jsiso/particles/EffectLoader',
                'jsiso/utils'
            ],
            function(CanvasControl, CanvasInput, imgLoader, jsonLoader, TileField, pathfind, EffectLoader, utils) {

                // -- FPS --------------------------------
                window.requestAnimFrame = (function() {
                    return window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function(callback, element) {
                            window.setTimeout(callback, 1000 / 60);
                        };
                })();
                // ---------------------------------------


                function launch() {

                    jsonLoader(['map.json', 'imageFiles.json']).then(function(jsonResponse) {

                        let images = [{
                                graphics: jsonResponse[1].groundImages,
                            },
                            {
                                graphics: jsonResponse[1].objectImages,
                            },
                            {
                                graphics: jsonResponse[1].playerImages
                            }
                        ];

                        imgLoader(images).then(function(imgResponse) {
                            let tileEngine = new main(0, 0, 14, 14, imgResponse[2]);
                            tileEngine.init([{
                                    //How far can the player see?
                                    title: "Ground Layer",
                                    layout: jsonResponse[0].ground,
                                    graphics: imgResponse[0].files,
                                    graphicsDictionary: imgResponse[0].dictionary,
                                    shadowDistance: {
                                        color: false,
                                        distance: 10,
                                        darkness: 1
                                    },
                                    shadow: {
                                        offset: 20,
                                        verticalColor: '(5, 5, 30, 0.4)',
                                        horizontalColor: '(6, 5, 50, 0.5)'
                                    },
                                    lightMap: [
                                        [5, 5, 4, 1],
                                        [20, 20, 4, 1]
                                    ],
                                    heightMap: {
                                        map: jsonResponse[0].height,
                                        offset: 20,
                                        heightTile: imgResponse[0].files["blank-block.png"]
                                    },
                                    tileHeight: 50,
                                    tileWidth: 100
                                },
                                {
                                    title: "Object Layer",
                                    layout: jsonResponse[0].objects,
                                    graphics: imgResponse[1].files,
                                    graphicsDictionary: imgResponse[1].dictionary,
                                    zeroIsBlank: true,
                                    alphaWhenFocusBehind: {
                                        objectApplied: imgResponse[2].files["main.png"],
                                        apply: true
                                    },
                                    //Rendering distance
                                    shadowDistance: {
                                        color: false,
                                        distance: 10,
                                        darkness: 1
                                    },
                                    particleMap: jsonResponse[0].particles,
                                    lightMap: [
                                        [5, 5, 4, 1],
                                        [20, 20, 4, 1]
                                    ],
                                    heightMap: {
                                        map: jsonResponse[0].height,
                                        offset: 20,
                                        heightMapOnTop: true
                                    },
                                    tileHeight: 50,
                                    tileWidth: 100
                                }
                            ]);
                        });
                    });
                }


                function main(x, y, xrange, yrange, playerImages) {
                    self = this;
                    // Player and suspect models
                    let player = {
                        image: playerImages.files["1.png"],
                        xPos: 8,
                        yPos: 6,
                    };

                    let enemy = [{
                            id: 0,
                            image: playerImages.files["man-se.png"],
                            xPos: 4,
                            yPos: 11
                        },
                        {
                            id: 1,
                            image: playerImages.files["man-se.png"],
                            xPos: 4,
                            yPos: 13
                        },
//                        {
//                            id: 2,
//                            image: playerImages.files["man-se.png"],
//                            xPos: 4,
//                            yPos: 8
//                        },
                        {
                            id: 3,
                            image: playerImages.files["man-se.png"],
                            xPos: 4,
                            yPos: 15
                        }
                    ];


                    let mapLayers = [];
                    let tile_coordinates = {};
                    let mouse_coordinates = {};
                    let startY = y;
                    let startX = x;
                    let rangeX = xrange;
                    let rangeY = yrange;
                    let calculatePaths = 0;
                    let speed = 0.5;

                    let rain = null;
                    
                    //Here you can change the text
                    let bookCase = "packed tightly with a number of books that I have no interest in, there are some on astology, numerology, and other studies that aren't seen as very useful. There seemst obe one that's missing"
                    let lamp = "There's nothing unusual about the lamp."
                    let vDesk = "This is the victim's desk"
                    let stainGlass = "It looks as if the window is open, I think I can climb through."
                    let wallCandle = "The flame is wavering in an odd fashion."
                    let standCandle = "The light adds an even more somber feel to the grisly scene."
                    let vDoor = "The door to the victim's room is locked, there are no signs of forced entry, thankfully, I have the key."
                    let eDoor = "I leave the room."
                    let sDoor = "I enter the room."
                    



                    let context = CanvasControl.create("canavas", 920, 600, {
                        background: "#000022",
                        display: "block",
                        marginLeft: "auto",
                        marginRight: "auto"
                    });
                    CanvasControl.fullScreen();
                    //Controls where the player move when the "up" key is pressed

                    //JSIso controls
                    let input = new CanvasInput(document, CanvasControl());
                    
                
                    input.keyboard(function(pressed, keydown) {
                      if (!keydown) {
                          switch (pressed) {
                            case 38:
                                player.image= playerImages.files["1.png"];
                                if (Number(mapLayers[1].getTile([player.xPos], [player.yPos - 1])) === 0) {
                                    player.yPos--;
                               //  console.log("Y is " + player.yPos); 
                                    mapLayers[1].applyFocus(player.xPos, player.yPos);
                                    if (startX > 0 && player.yPos <= mapLayers[0].getLayout().length - 1 - rangeY / 2) {
                                        mapLayers.map(function(layer) {
                                            layer.move("down");
                                        });
                                        startX--;
                                    }
                                }
                                break;
                                //Controls where the player move when the "right" key is pressed

                            case 39:
                                player.image= playerImages.files["4.png"];
                                if (Number(mapLayers[1].getTile([player.xPos + 1], [player.yPos])) === 0) {
                                    player.xPos++;
                                 //  console.log("x is " + player.xPos); 
                                    mapLayers[1].applyFocus(player.xPos, player.yPos);
                                    if (startY + rangeY < mapLayers[0].getLayout().length && player.xPos >= 0 + 1 + rangeX / 2) {
                                        mapLayers.map(function(layer) {
                                            layer.move("left");
                                        });
                                        startY++;
                                    }
                                }
                                break;
                                //Controls where the player move when the "down" key is pressed
                            case 40:
                                
                                if (Number(mapLayers[1].getTile([player.xPos], [player.yPos + 1])) === 0) {
                                    player.yPos++;
                                    player.image= playerImages.files["3.png"];
                                  // console.log("Y is " + player.yPos); 
                                    mapLayers[1].applyFocus(player.xPos, player.yPos);
                                    if (startX + rangeX < mapLayers[0].getLayout().length && player.yPos >= 0 + 1 + rangeY / 2) {
                                        mapLayers.map(function(layer) {
                                            layer.move("right");
                                        });
                                        startX++;
                                    }
                                }
                                break;
                                //Controls where the player move when the "left" key is pressed
                            case 37:
                                
                                if (Number(mapLayers[1].getTile([player.xPos - 1], [player.yPos])) === 0) {
                                    player.xPos--;
                                    player.image= playerImages.files["2.png"];
                                   //console.log("x is " + player.xPos); 
                                    mapLayers[1].applyFocus(player.xPos, player.yPos);
                                    if (startY > 0 && player.xPos <= mapLayers[0].getLayout().length - 1 - rangeX / 2) {
                                        mapLayers.map(function(layer) {
                                            layer.move("up");
                                        });
                                        startY--;

                                    }
                                }
                                break;

                                //activate event when "space" is pressed
                            case 32:
                                if (player.xPos == 5 && player.yPos == 4) {
                                    alert(bookCase);
                                    
                                };
                                if (player.xPos == 4 && player.yPos == 6) {
                                    alert(stainGlass);
                                    
                                };
                                if (player.xPos == 7 && player.yPos == 6 || player.xPos == 6 && player.yPos == 5) {
                                    alert(vDesk);
                                   
                                }
                             if (player.xPos == 4 && player.yPos == 7 || player.xPos == 4 && player.yPos == 5) {
                                    alert(wallCandle);
                                    return;
                                }
                                  if (player.xPos == 9 && player.yPos == 5 || player.xPos == 10 && player.yPos == 4 || player.xPos == 8 && player.yPos == 4) {
                                    alert(standCandle);
                                    
                                } 
                                  if (player.xPos == 13 && player.yPos == 6 ) {
                                    alert(eDoor);
                                      player.xPos = 15
                                  }
                                  else if (player.xPos == 15) {
                                          console.log(vDoor);
                                         player.xPos = 13
                                    
                               } 
                                  return;
                                  
                                  if (player.xPos == 17 && player.yPos == 6 ) {
                                    console.log(sDoor);
                                      player.xPos = 19
                                  } else if (player.xPos == 19) {
                                          console.log(eDoor);
                                         player.xPos = 17
                                    return;
                               }
//                                      if (player.xPos == 9 && player.yPos == 5 || player.xPos == 10 && player.yPos == 4 || player.xPos == 8 && player.yPos == 4) {
//                                    console.log(standCandle);
//                                    return;
//                                } if (player.xPos == 9 && player.yPos == 5 || player.xPos == 10 && player.yPos == 4 || player.xPos == 8 && player.yPos == 4) {
//                                    console.log(standCandle);
//                                    return;
//                                } if (player.xPos == 9 && player.yPos == 5 || player.xPos == 10 && player.yPos == 4 || player.xPos == 8 && player.yPos == 4) {
//                                    console.log(standCandle);
//                                    return;
//                                }
                                
                                
                                break;

//                                Turn on shadows with the "1" key
                            case 49:
                                mapLayers.map(function(layer) {
                                    layer.toggleGraphicsHide(true);
                                    layer.toggleHeightShadow(true);
                                });
                                break;
                                //Turn off the shadows with the "2" key
                            case 50:
                                mapLayers.map(function(layer) {
                                    layer.toggleGraphicsHide(false);
                                    layer.toggleHeightShadow(false);
                                });
                                break;
                        }
                        }
                    });

                    function draw() {
                        context.clearRect(0, 0, CanvasControl().width, CanvasControl().height);
                        calculatePaths++;
//                        if (calculatePaths === 100) {
//                            enemy.map(function(e) {
//                                pathfind(e.id, [e.xPos, e.yPos], [player.xPos, player.yPos], mapLayers[1].getLayout(), false).then(function(data) {
//                                    if (data.length > 0 && data[1] !== undefined) {
//                                        e.xPos = data[1].x;
//                                        e.yPos = data[1].y;
//                                    }
//                                });
//                            });
//                            calculatePaths = 0;
//                        }
                        for (let i = startY, n = startY + rangeY; i < n; i++) {
                            for (let j = startX, h = startX + rangeX; j < h; j++) {
                                mapLayers.map(function(layer) {
                                    layer.setLight(player.xPos, player.yPos);
                                    if (i === player.xPos && j === player.yPos && layer.getTitle() === "Object Layer") {
                                        layer.draw(i, j, player.image);
                                    } else {
                                        layer.draw(i, j);
                                    }
                                    enemy.map(function(e) {
                                        if (i === e.xPos && j === e.yPos && layer.getTitle() === "Object Layer") {
                                            layer.draw(i, j, e.image);
                                        }
                                    });
                                });
                            }
                        } // Enable rain
                        //          rain.Draw(CanvasControl().width / 4, 0);

                        requestAnimFrame(draw);
                    }

                    return {
                        init: function(layers) {
                            for (let i = 0; i < 0 + layers.length; i++) {
                                mapLayers[i] = new TileField(context, CanvasControl().height, CanvasControl().width);
                                mapLayers[i].setup(layers[i]);
                                mapLayers[i].align("h-center", CanvasControl().width, xrange, 0);
                                mapLayers[i].align("v-center", CanvasControl().height, yrange, 0);
                            }
                            rain = new EffectLoader().getEffect("rain", context, utils.range(-100, CanvasControl().height), utils.range(-100, CanvasControl().width));
                            draw();
                        }

                    }

                }
            
            function drawBubble(ctx, x, y, w, h, radius)
{
  var r = x + w;
  var b = y + h;
  ctx.beginPath();
  ctx.strokeStyle="black";
  ctx.lineWidth="2";
  ctx.moveTo(x+radius, y);
  ctx.lineTo(x+radius/2, y-10);
  ctx.lineTo(x+radius * 2, y);
  ctx.lineTo(r-radius, y);
  ctx.quadraticCurveTo(r, y, r, y+radius);
  ctx.lineTo(r, y+h-radius);
  ctx.quadraticCurveTo(r, b, r-radius, b);
  ctx.lineTo(x+radius, b);
  ctx.quadraticCurveTo(x, b, x, b-radius);
  ctx.lineTo(x, y+radius);
  ctx.quadraticCurveTo(x, y, x+radius, y);
  ctx.stroke();
}
function dispQuote() 
{
  var canvas = document.getElementById('canvas1');
//  var ctx = canvas.getContext('2d'); 
  drawBubble(ctx, 10,60,220, 90, 20);
}
window.onload=dispQuote;
            

                launch();

            });
