/**
 * @author: zzw
 */
'use strict'

const axios = require('axios')
const request = axios.create();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// require('dotenv').config() // 默认是.env文件

process.env.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36 Edg/90.0.818.49"
process.env.postToken = "glados.network"

// 读取cookie
console.log("打印出cookie:", process.env.COOKIE)
request.defaults.headers.common.cookie = process.env.COOKIE;

request.defaults.headers.common["user-agent"] = process.env.UserAgent

// 签到请求
const checkIn = () =>{
  return request({
    method: 'post',
    url: 'https://glados.rocks/api/user/checkin',
    data: {
      token: process.env.postToken,
    }
  })
}

// 获得状态
const getStatus = ()=>{
  return request({
    method: 'get',
    url: 'https://glados.rocks/api/user/status',
    data: {
      token: process.env.postToken ,
    }
  })
}

// 处理数据结果
function dealData(checkInRes, statusRes){
  return {
    message: checkInRes.message,
    // checkInRec: checkInRes.list,
    useDays: statusRes.days,
    email: statusRes.email,
    leftDays: parseFloat(statusRes.leftDays).toFixed(),
  }
}

function pushMessage(content){
  return request({
    method: 'get',
    url: 'http://www.pushplus.plus/send',
    "Content-Type": "application/json",
    data: {
      token: process.env.TOKEN,
      title: 'GlaDos签到结果',
      content: content,
      template: 'html',
    } 
  });
}

function prettyRes(res){
  let {useDays, leftDays, message, email} = res;
  let content = "<table border='1px solid black'><thead><tr><td>k</td><td>v</td></tr></thead><tbody>";
  let tr1 = "<tr><td>useDays</td><td>" + useDays + "</td></tr>";
  let tr2 = "<tr><td>leftDays</td><td>" + leftDays + "</td></tr>";
  let tr3 = "<tr><td>email</td><td>" + email + "</td></tr>";
  let tr4 = "<tr><td>message</td><td>" + message + "</td></tr>";
  let tail = "</tbody></table>";
  content += (tr1 + tr2 + tr3 + tr4 + tail);
  return content;
}


async function checkOnce(){
  const checkInRes =  await checkIn().catch(err=>{
    console.error("checkOnce.checkIn")
    console.error(err);
  });
  const statusRes = await getStatus().catch(err=>{
    console.error("checkOnce.getStatus")
    console.error(err);
  });
  return{
    checkInRes: checkInRes.data,
    statusRes: statusRes.data.data, 
  }
}
async function main(){

  let res = null;
  let checkOnceRes = await checkOnce().catch(err=>{
    console.error("main.checkOnce");
    console.error(err);
  });
  res = dealData(checkOnceRes.checkInRes, checkOnceRes.statusRes);
  console.log(res);
  if(res.code == 0){
    // 签到成功
    console.log("签到成功")
  }else if(res.message == 'Please Try Tomorrow'){
    // 签到过了
    console.log("签到过了")
  }
 
  let content = prettyRes(res);
  pushMessage(content);
  console.log("推送微信成功");
}

main()
