
//加载数据
var texts; //存放数据
var tds = '';
var select_options = "<td class='word_type'>  \
                        <select class='test'>                \
                        <option value='a'>银行</option>  \
                        <option value='b'>业务</option>      \
                        <option value='c'>产品</option>   \
                        <option value=''>法律法规</option> \
                        <option value=''>其他</option>   \
                        </select>                         \
                      </td>";





var current_edit_index = -1;

$.get("/web/data/text.json",function(data){
  texts = data.texts;
  $('#text_container').text(texts[0].join(''));
  update_table();
})


//合并
function merge(index)
{
  if(index>=0 && index<texts[0].length-1){
    texts[0][index] += texts[0][index+1];
    texts[0].splice(index+1,1);
    update_table();
  }
  else{
    toastr.error("超出范围！无法进行合并操作！");
  }
}

//编辑内容
function edit(index)
{
  current_edit_index = index;
  $('#fenci').foundation('reveal', 'open');
  $('.words').val(texts[0][index]);
  $('.words').focus();
}

function re_fenci(){
  if(current_edit_index >= 0){
    $(document).foundation('reveal', 'close');
    texts[0].splice(current_edit_index,1);
    var words = $('.words').val().trim().split(' ');
    for(var i=words.length-1;i>=0;i--)
    {
      texts[0].splice(current_edit_index,0,words[i]);
    }
    update_table();
  }
}

function save_table(){
  //读取table数据 写会json文件
}





//更新表格
function update_table(){
  $('.word_table_body tr').remove();
  for(var i=0;i<texts[0].length;i++){

    //console.log(tds);
    var edit_html = "<td><span class='badge badge-info' onclick='merge( "
                + i
                + ")'>向下合并 </span>&nbsp;&nbsp;"
                + "<span class='badge badge-info' onclick='edit( "
                + i
                +")'>重新分词</span></td>";

    tds = "<td class='word_value'>"+texts[0][i]+"</td>" + select_options + edit_html;
    $(".word_table_body").append("<tr>"+tds+"</tr>");
    tds = "";
  }


}





//保存设置
