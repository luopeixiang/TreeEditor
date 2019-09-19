function close_modal() {
        $(document).foundation('reveal', 'close');
}

var tree_root;
var create_node_modal_active = false;
var rename_node_modal_active = false;
var add_node_att_active = false;
var edit_node_att_active = false;
var create_node_parent = null;
var node_to_rename = null;
var node_to_add_att = null;
var node_to_edit_att = null;
var current_node = null;
var current_att_index = -1;

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

//加入父母属性
var setParent = function(o){
     if(o.children != undefined){
          for(n in o.nodes){
              o.children[n].parent = o;
              setParent(o.children[n]);
          }
     }
}

//客户端导出文件
function exportToJson(filename, tree_root) {
        var jsonFile = JSON.stringify(tree_root,["name","children","attributes","_children"],4);

        var blob = new Blob([jsonFile], { type: 'text/json;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
//客户端上传文件
function loadFile() {
    var input, file, fr;

    if (typeof window.FileReader !== 'function') {
      alert("The file API isn't supported on this browser yet.");
      return;
    }

    input = document.getElementById('fileinput');
    if (!input) {
      alert("Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
      alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
      alert("Please select a file before clicking 'Load'");
    }
    else {
      file = input.files[0];
      fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);
    }

    function receivedText(e) {
      lines = e.target.result;
      var newArr = JSON.parse(lines);
      console.log(newArr);
      tree_root = newArr;
      root = newArr;


      //存在问题！
      outer_update(tree_root);
      update_att_table();
      toastr.success('上传成功！');
      close_modal();
    }
  }


function create_node() {
        if (create_node_parent && create_node_modal_active) {
                if (create_node_parent._children != null)  {
                        create_node_parent.children = create_node_parent._children;
                        create_node_parent._children = null;
                }
                if (create_node_parent.children == null) {
                        create_node_parent.children = [];
                }
                id = generateUUID();
                name = $('#CreateNodeName').val();
                new_node = { 'name': name,
                             'id' :  id,
                             'depth': create_node_parent.depth + 1,
                             'children': [],
                             '_children':[]
                           };
                console.log('Create Node name: ' + name);
                create_node_parent.children.push(new_node);
                create_node_modal_active = false;
                $('#CreateNodeName').val('');

        }
        close_modal();
        outer_update(create_node_parent);

}

function create_node_att(){
  if(add_node_att_active && node_to_add_att){
    att_name = $('#att_name').val();
    att_lei = $('#att_lei').val();
    att_xing = $('#att_xing').val();
    att = [att_name,att_lei,att_xing];

    try{
      node_to_add_att.attributes.push(att);
      update_att_table();
    }
    catch(e){
      node_to_add_att.attributes=[];
      node_to_add_att.attributes.push(att);
      update_att_table();
    }

    add_node_att_active = false;
  }
  close_modal();
  outer_update(node_to_rename);


}

function rename_node() {
        if (node_to_rename && rename_node_modal_active) {
                name = $('#RenameNodeName').val();
                console.log('New Node name: ' + name);
                node_to_rename.name = name;
                rename_node_modal_active = false;

        }
        close_modal();
        outer_update(node_to_rename);

}

function delete_node_att(i){
      if(current_node){
        current_node.attributes.splice(i,1);
        toastr.success('已经删除！');
        //更新表格
        update_att_table();
      }

}

function edit_node_att(i){
      console.log("You are editing node!");
      current_att_index = i;
      if(current_node){
        $('#EditAtt').foundation('reveal', 'open');
        $('#att_name_edit').val(current_node.attributes[i][0]);
        $('#att_lei_edit').val(current_node.attributes[i][1]);
        $('#att_xing_edit').val(current_node.attributes[i][2]);

      }

}


function rename_node() {
        if (node_to_rename && rename_node_modal_active) {
                name = $('#RenameNodeName').val();
                console.log('New Node name: ' + name);
                node_to_rename.name = name;
                rename_node_modal_active = false;

        }
        close_modal();
        outer_update(node_to_rename);

}


function save_node_att(){
      if(current_node && current_att_index>=0){
        att = current_node.attributes;
        att[current_att_index][0] = $('#att_name_edit').val();
        att[current_att_index][1] = $('#att_lei_edit').val();
        att[current_att_index][2] = $('#att_xing_edit').val();

      }
      close_modal();
      outer_update(node_to_rename);
      update_att_table();


}

function update_att_table(){
  if(current_node){
    $('.attr_table_body tr').remove();
    //添加自身属性

    var atts = current_node.attributes;
    if(atts){
        for(var i=0;i<atts.length;i++) //行
        {
        var tds = "";
        for(j=0;j<atts[i].length;j++)
        {
          tds += "<td>"+atts[i][j]+"</td>";
        }


        tds = tds + "<td> <span class='badge badge-info' onclick='edit_node_att( "
                  + i
                  + " )'> 编辑</span> <span class='badge badge-danger' onclick='delete_node_att( "
                  + i
                  + " )'> 删除</span> </td>";

        console.log(tds);
        $('.attr_table_body').append("<tr>"+tds+"</tr>");
      }
    }
    else{
      $('#cate_name').text("当前节点："+current_node.name+"");
    }

    //添加父类属性
    var parent = current_node.parent;
    while(parent){

      var atts = parent.attributes;
      if(atts){
        var name = parent.name;

        for(var i=0;i<atts.length;i++) //行
        {
          var tds = "";
          for(var j=0;j<atts[i].length;j++)
          {
            tds += "<td>"+atts[i][j]+"</td>";
          }

          tds = tds + "<td><span class='badge badge-info' title='该属性来自父类 "
                    + name
                    +"' >父类属性</span></td>";
          $('.attr_table_body').append("<tr>"+tds+"</tr>");

        }
      }


      parent = parent.parent;
    }


  }
}



function save_tree() {
        var cache = [];

        $.ajax('/tree', {
            contentType : 'application/json',
            type : 'POST',
            // data : JSON.stringify(tree_root, function(key, value) {
            //         if (typeof value === 'object' && value !== null ) {
            //             if (cache.indexOf(value) !== -1) {
            //                 // Circular reference found, discard key
            //                 return;
            //             }
            //             // Store value in our collection
            //             cache.push(value);
            //         }
            //         else if(typeof value !== 'string'){
            //           return undefined;
            //         }
            //         // else if (keywords.indexOf(key)<0) {
            //         //     return ;
            //         // }
            //         return value;
            //     },4),
            data : JSON.stringify(tree_root,["name","children","attributes","_children"],4),
               });
        cache = null;
        outer_update(tree_root);
        toastr.success('已经保存！')
}

outer_update = null;


// Get JSON data
treeJSON = d3.json("/tree", function(error, treeData) {

    // Calculate total nodes, max label length
    console.log(treeData);
    setParent(treeData);


    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });




    var menu = [
            {
                    title: '重命名节点',
                    action: function(elm, d, i) {
                            console.log('hhhhhhh');
                            $("#RenameNodeName").val(d.name);
                            rename_node_modal_active = true;
                            node_to_rename = d
                            $("#RenameNodeName").focus();
                            $('#RenameNodeModal').foundation('reveal', 'open');
                    }
            },
            {
                    title: '删除节点',
                    action: function(elm, d, i) {
                            console.log('ooooooo');
                            delete_node(d);
                    }
            },
            {
                    title: '创建子节点',
                    action: function(elm, d, i) {
                            console.log('Create child node');
                            create_node_parent = d;
                            create_node_modal_active = true;
                            $('#CreateNodeModal').foundation('reveal', 'open');
                            $('#CreateNodeName').focus();
                    }
            },
            {
                    title: '增加本节点属性',
                    action: function(elm, d, i) {
                            console.log('Create node att');
                            node_to_add_att = d;
                            add_node_att_active = true;

                            $('#att_name').val('');
                            $('#att_lei').val('');
                            $('#att_xing').val('');
                            $('#att_degree').val('');

                            $('#CreateAtt').foundation('reveal', 'open');
                    }
            },


    ]


    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });

    function delete_node(node) {
        visit(treeData, function(d) {
               if (d.children) {
                       for (var child of d.children) {
                               if (child == node) {
                                       d.children = _.without(d.children, child);
                                       update(root);
                                       break;
                               }
                       }
               }
        },
        function(d) {
           return d.children && d.children.length > 0 ? d.children : null;
       });
    }


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function(d) {
                    return d.id;
                }).filter(function(d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function(d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);


    // Define the drag listeners for drag/drop behaviour of nodes.
    dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function(d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }

            // get coords of mouseEvent relative to svg container to allow for panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function(d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                console.log("select node is ",selectedNode);
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            centerNode(draggingNode);
            draggingNode = null;
        }
    }

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when
    // collapsing/moving with large amount of children.

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {
        console.log("jjjjj");

        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        console.log("当前节点：",d);
        $('#cate_name').text("当前节点："+d.name);

        $('.attr_table_body tr').remove();

        current_node = d;
        update_att_table();
        //显示节点属性   attr_table_body
        // try
        // {
        //   var atts = d.attributes;
        //
        //   for(var i=0;i<atts.length;i++) //行
        //   {
        //     var tds = "";
        //     for(j=0;j<atts[i].length;j++)
        //     {
        //       tds += "<td>"+atts[i][j]+"</td>";
        //     }
        //     //增加操作 列
        //
        //
        //     tds = tds+ "<td> <span class='label label-default' onclick='edit_node_att( "
        //              + i
        //               + " )'> 编辑</a> <span class='label label-danger' onclick='delete_node_att( "
        //               + i
        //               + " )'> 删除</span> </td>";
        //
        //     console.log(tds);
        //     $('.attr_table_body').append("<tr>"+tds+"</tr>");
        //
        //   }
        // }
        // catch(e){
        //   $('#cate_name').text("当前节点："+d.name+"  本节点目前没有属性");
        // }


        update(d);
        centerNode(d);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 300); //300px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Add a context menu
        node.on('contextmenu', d3.contextMenu(menu));


        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    outer_update = update;

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
    tree_root = root;
});
