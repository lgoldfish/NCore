import Ncore from "./NCore";
class LocalMng extends Ncore {
    httpReqCount = 0;
    constructor(options = {}) {
        super();
        const { uuids, connectType , isDebug ,token} = options;
        if(connectType!== 'webSocket' || 'http' || 'auto'){
           return new Error('connectType input error');
        }
        this.connectType = connectType;
        this.uuids = uuids;
        this.token = token;
        //检测蓝牙是否开启
        wx.getBluetoothAdapterState({
            success: res => {
                if (res.available) {
                    isDebug && console.log("蓝牙已打开");
                    this.getBeacons();
                } else {
                    isDebug && console.log("蓝牙未打开")
                }
            }
        });
        //监测蓝牙开启关闭状态
        wx.onBluetoothAdapterStateChange(res => {
            if (res.available) {
                isDebug && console.log("蓝牙开启")
                this.getBeacons();
            } else {
                isDebug && console.log("蓝牙关闭");
            }
        });
        //监测加速度
        wx.startAccelerometer({
            success: res => {
                wx.onAccelerometerChange(res => {
                    const { x, y, z } = res;
                    // console.log("accelerometer",JSON.stringify(res))
                    if (x && y && z) {
                        const num = Math.sqrt((x * x) + (y * y));
                        // console.log("num is",num)
                        if (num < 0.1) {
                            this.move = 0;
                        } else {
                            this.move = 1;
                        }
                    }
                })
            },
            fail: err => {
                isDebug && console.log("开启加速度失败", err)
            }
        })
        //监测手机品牌
        const brand = wx.getSystemInfoSync().brand.toLowerCase();
        if (brand == 'iphone') {
            this.terminalType = 1;
        } else {
            this.terminalType = 0;
        }
        //监测webSocket 状态
        if (this.connectType !== 'http') {
            this.connectSocket();
        }
        wx.onSocketOpen((res) => {
            isDebug &&  console.log('WebSocket连接已打开！', res)
        })
        wx.onSocketError((res) => {
            isDebug && console.log('WebSocket连接打开失败，请检查！')
        })
        wx.onSocketMessage(function (res) {
            isDebug && console.log('收到服务器内容')
        })
        wx.onSocketClose((res) => {
            isDebug && console.log('WebSocket 已关闭！', res)
        })
        wx.onSocketClose((res) => {
            isDebug && console.log('WebSocket 已关闭！')
        })
    }
    // 获取beacons 原始数据
    getBeacons() {
        wx.startBeaconDiscovery({
            uuids: this.uuids,
            complete: beacons => {
                this.fire("beacons", JSON.stringify(beacons));
            },
            success: res => {
                wx.getBeacons({
                    complete: beacons => {
                        this.fire("beacons", JSON.stringify(beacons));
                        this.sendBeacons(beacons.beacons);
                    }
                })
                wx.onBeaconUpdate((beacons) => {
                    this.fire("beacons", JSON.stringify(beacons));
                    this.sendBeacons(beacons.beacons)
                })
            }
        })
    }
    // 发送给server 的beacons 数据
    sendBeacons(beacons) {
        const arr = [];
        for (let i = 0; i < beacons.length; i += 1) {
            Number(beacons[i].rssi) !== 0 && arr.push(beacons[i]);
        }
        arr.sort((a, b) => Number(a.accuracy) - Number(b.accuracy));
        const beaconsSlice = arr.slice(0, 10);
        let userId = app.globalData.openid;
        cos
        let token = this.token;
        const ble = [];
        for (let i = 0; i < beaconsSlice.length; i += 1) {
            ble.push({
                mac: `${beaconsSlice[i].major}:${arr[i].minor}`,
                rssi: beaconsSlice[i].rssi,
                accuracy: beaconsSlice[i].accuracy,
                txpower: beaconsSlice[i].txpower,
            });
        }
        let json = { ble, userid: userId, move: this.move, sys: this.terminalType, token };
        this.fire("sendBeacons", JSON.stringify(json));
        switch (this.connectType) {
            case 'webSocket':
                wx.sendSocketMessage({
                    data: JSON.stringify(json),
                    success: res => {
                        isDebug && console.log("sendSocketMessage success", res)
                    },
                    fail: error => {
                        isDebug && console.log("sendSocketMessage error", error)
                    }
                })
                break;
            case 'http':
                this.postBeacons(json).then((res) => {

                });
                break;
            case 'auto':
                wx.sendSocketMessage({
                    data: JSON.stringify(json),
                    success: res => {
                        isDebug && console.log("sendSocketMessage success", res);
                    },
                    fail: error => {
                        isDebug && console.log("sendSocketMessage error", error);
                        isDebug && console.log("connectType==auto now checkout requst");
                        wx.closeSocket()
                    }
                });
                this.postBeacons(json).then((res) => {
                    if (res === 'fail') {
                        httpReqCount = 0;
                    } else {
                        httpReqCount++;
                        if (httpReqCount === 10) {
                            this.connectSocket();
                        }
                    }
                });
                break;
            default:
                return ;
        }
    }
    // http 发送数据
    postBeacons(json) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: "https://apiweixinprogram.ipalmap.com/locationData/source", //仅为示例，并非真实的接口地址
                method: "POST",
                data: JSON.stringify(json),
                header: {
                    "content-type": "application/json" // 默认值
                },
                success: res => {
                    resolve("success");

                },
                fail: error => {
                    reject("fail");
                }
            });
        })
    }
}
export default LocalMng; 