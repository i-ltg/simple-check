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
const postToken = "glados.one"


request.defaults.headers.common["user-agent"] = process.env.UserAgent

// 签到请求
const checkIn = () =>{
  return request({
    method: 'post',
    url: 'https://glados.rocks/api/user/checkin',
    data: {
      token: postToken,
    }
  })
}

// 获得状态
const getStatus = ()=>{
  return request({
    method: 'get',
    url: 'https://glados.rocks/api/user/status',
    data: {
      token: postToken,
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

function pushMessage(content, token){
  return request({
    method: 'get',
    url: 'http://www.pushplus.plus/send',
    "Content-Type": "application/json",
    data: {
      token,
      title: 'GlaDos签到结果',
      content: content,
      template: 'markdown',
    } 
  });
}

function prettyRes(res){
  let {leftDays, message, email} = res;
  let content = "| 字段 | 值|\n| ---------- | --- |\n"
  let tr1 = "| 剩余天数 | " +  leftDays + "|\n";
  let tr2 = "| 邮箱     | " + email + "|\n";
  let tr3 = "| 签到消息 | " + message + "|\n";
  content += (tr1 + tr2 + tr3);
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
async function checkOnePerson(cookieI, tokenI){
    // 读取cookie
  request.defaults.headers.common.cookie = cookieI;

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
  pushMessage(content, tokenI);
  console.log("推送微信成功");
}

async function main(){
  //1. 将cookie， token全部构建为列表
  const checkInNum = process.env.CHECK_IN_NUM;
  for(let i = 0; i < checkInNum; i++){
    let cookieI = eval("process.env.COOKIE_" + i);
    // console.log(cookieI);
    let tokenI =  eval("process.env.TOKEN_" + i);
    
    // 同步等待check in
    await checkOnePerson(cookieI, tokenI);
  }
  


  //2. 堆每个列表同步进行request

}
main()
