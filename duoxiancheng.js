//这里用bsc 链举例子
//加载web3的库
var Web3 = require('web3');
var fs = require('fs');
var mainWindow = null; //用来给前台发信息
var web3 = null;
var chainid = 1;
var nownetwork = 'eth';
var priKeys = getPriKeys("./prikey.prikey")
process.env.UV_THREADPOOL_SIZE =20
function getPriKeys(prikeyPath) {

    var filecon = fs.readFileSync(prikeyPath).toString();
    filecon = filecon.replace("\r"), "";
    var privKeyFile = filecon.split("\n");

    var arr = new Array();
    for (line in privKeyFile) {
        privKeyFile[line] = privKeyFile[line].replace("0x", "");
        //console.log(privKeyFile[line]);
        arr.push(new Buffer.from(privKeyFile[line].trim(), "hex"))
    }
    //console.log(arr);
    return arr;
}
function initWeb3(value) {
    if (web3 != null) {
        web3 = null;
    }
    if (value.webtype == 'rpc') {
        var rpcweb3 = new Web3(new Web3.providers.HttpProvider(value.weburl));
        web3 = rpcweb3;
    }
    else if (value.webtype == 'ws') {
        var wscweb3 = new Web3(new Web3.providers.WebsocketProvider(weburl));
        web3 = wscweb3;
    }
    else {
        return false;
    }
    chainid = Number(value.chainid.toString())
    nownetwork = value.nownetwork;
    return true;
}

//用私钥将交易内容签名
var EthereumTx = require('ethereumjs-tx');
const util = require('ethereumjs-util')
//这里是加载私钥的部分



function getPriKey(prikeystring) {
    prikeystring = prikeystring.replace("0x", "")
    const privKey = new Buffer.from(prikeystring, "hex");
    return privKey;
}


//通过小数点多少位，转换对应的数据
function getweiname(tokendecimals = 18) {
    tokendecimals = Number(tokendecimals.toString())
    weiname = 'ether';

    switch (tokendecimals) {
        case 3:
            weiname = "Kwei";
            break;
        case 6:
            weiname = 'mwei';
            break;
        case 9:
            weiname = 'gwei';
            break;
        case 12:
            weiname = 'microether ';
            break;
        case 15:
            weiname = 'milliether';
            break;
        case 18:
            weiname = 'ether';
            break;
        default:
            weiname = 'ether';
            break;

    }
    return weiname;
}

//这里是将交易用私钥签名部分
function getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) {

    var rawTransaction = {
        "from": fromAddress,
        "nonce": web3.utils.toHex(nonceNum),
        "gasLimit": web3.utils.toHex(gaslimit),
        "gasPrice": web3.utils.toHex(gasPrice),
        "to": toAddress,
        "value": web3.utils.toHex(nbnb),
        "data": input,  //设置num属性
        "chainId": chainid //4:Rinkeby, 3:Ropsten, 1:mainnet

    };

    var tx = new EthereumTx(rawTransaction);
    tx.sign(privKey);
    var serializedTx = tx.serialize();
    return serializedTx;
}


//这里是将签名的内容发送到区块链网络中的代码
const signTransaction = async (fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) => {
    var serializedTx = getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit)

    // Comment out these three lines if you don't really want to send the TX right now
    console.log(`Attempting to send signed tx:  ${serializedTx.toString('hex')}`);
    var receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);
    if (receipt.status == true) {
        return true;
    }
    return false;
}

const getBNBBalance = async (address) => {
    let result = await web3.eth.getBalance(address)
    //由于使用的是大数模式，小数点有18位，所以获得的balance 要除以10^18次方才是正确的数据
    //或者使用自带的转换工具
    //原始区块链数据中存的BNB的数量是

    let balance = web3.utils.fromWei(result.toString(10), getweiname());
    return balance;
}
//私钥，合约地址，inputdata，主币数量，gas费，最大gasuse
const qianggouNFT = async (priKey, walletaddress, inputdata, value, gas, ngasLimit) => {
    //获得自己的地址
    //var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
    //XinBao
    var fromAddressStr = util.privateToAddress(priKey).toString('hex');
    var fromAddress = "0x" + fromAddressStr;


    var toAddress = walletaddress

    var nsendETH = value
    //假设交易 0.008个bnb
    var nbnb = web3.utils.toWei((nsendETH).toString(10), 'ether');
    //设置gasprice 为 5G wei
    var gasPrice = web3.utils.toWei((gas).toString(10), 'Gwei');
    //设置 gaslimit 为 420000
    var gaslimit = ngasLimit
    //没有调用智能合约，将input设置为空
    var input = inputdata
    //XinBao
    var newinput = input.replaceAll('$$',fromAddressStr);
    //获得下一次交易的数
    console.log("发送地址是：" + fromAddress)
    var nonceCnt = await web3.eth.getTransactionCount(fromAddress);
    //Xinbao
    //sendmsg(fromAddress + "处理成功 "+input+"变更为"+newinput);
    let reslut = await signTransaction(fromAddress, toAddress, newinput, nonceCnt, priKey, gasPrice, nbnb, gaslimit)
    if (reslut) {
        //console.log("交易成功")
        sendmsg(fromAddress + "交易成功");
    }
    else {
        //console.log("交易失败")
        sendmsg(fromAddress + "交易失败");
    }
}

function getNowMilliSecond() {
    return Math.floor(Date.now());
}

const testbalance = async (i, priKey) => {

    i = i + 1
    try {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
    }
    catch (e) {
        return;
    }

    //console.log("地址：" + fromAddress)
    var balance = await getBNBBalance(fromAddress);
    //if (Number(balance) > 0) 
    {
        msg = ("时间" + getNowMilliSecond() + "|第" + i + "个" + "地址:" + fromAddress + "有" + balance + "个" + nownetwork);
        sendmsg(msg);
    }



}

const getnonce = async (address) => {
    var nonceCnt = await web3.eth.getTransactionCount(address);
    //console.log("下一次交易数" + nonceCnt);
    return nonceCnt;
}


function test(value) {
    //var prikeyint = BigInt(0xaba9a9f7df9d19a5339073a9b5f2976d69b756dac39826a166353307d853cc80n); //这里填自己的私钥
    //启动程序
    /*for (var i = 0; i < 10; i++) {

       // main(i, prikeyint.toString(16))
       console.log(prikeyint.toString(16));
        prikeyint = prikeyint + 1n;
    }*/
    var i = 0;
    ////XinBao added
    var walletlimit = value.walletlimit;

    console.log("walletlimit" + walletlimit);
    for (priKey of priKeys) {
        testbalance(i, priKey);
        i++;
        if (i == walletlimit)
            break;
    }
}

function qianggou(value) {
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var inputdata = value.inputdata;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    var walletlimit = value.walletlimit;
    var i = 0;
    for (priKey of priKeys) {

        qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
        i = i+1;
        if( i == walletlimit)
            break;
        //break;
    }

}


function sendmsg(msg) {
    if (mainWindow != null) {
        mainWindow.webContents.send("info:msg", { msg });
    }
}

function setmainWindow(newmainWindow) {
    mainWindow = newmainWindow;
}

async function abishiyong(value) {
    //return;
    var abi = value.useabi;
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var nftaddress = value.nftaddress;
    var neth = value.neth;

   
        for (priKey of priKeys) {
            //这里要复制数字，不然就是指针模式
            okvalue = [].concat(value.okvalue);
            // 创建abi二进制
            // 如果要填自己的地址 ,默认通配符是 myaddress
            address = "0x" + util.privateToAddress(priKey).toString('hex');
            for (var i = 0; i < okvalue.length; i++) {
                try {
                    okvalue[i] = okvalue[i].replace("myaddress", address)
                }
                catch (e) {
                    ;
                }
            }
            if(abi.stateMutability=="view")
            {
                var tokenContract = new web3.eth.Contract([abi], nftaddress);
                var functionname = abi.name;
                let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
                sendmsg("地址："+address +"调用方法：" +functionname+"结果为" + result);
                
            }
            else
            {
                var inputdata = web3.eth.abi.encodeFunctionCall(abi, okvalue);
                qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
            }
            //break;
        }
}

module.exports = {
    initWeb3: initWeb3,
    test: test,
    qianggou: qianggou,
    setmainWindow: setmainWindow,
    abishiyong: abishiyong
}

