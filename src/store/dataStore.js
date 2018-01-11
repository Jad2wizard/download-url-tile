/**
 * Created by yaojia7 on 2017/8/24.
 */
import {observable, computed, action} from 'mobx';
import {message} from 'antd';
import computeTileXYZ from './../utils/tilexyz.js';
import {getUrl} from './../utils';

class DataStore{
    //根据经纬度值(lon1, lat1)和(lon2, lat2)生成的两个点定义一个矩形区域
    @observable lon1= 0;
    @observable lon2= 0;
    @observable lat1= 0;
    @observable lat2= 0;
    @observable zoom1= 0;
    @observable zoom2= 0;
    @observable loadEnable = true;
    @observable tileUrlTemplate = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieWFvamlhIiwiYSI6ImNqNTF3YjhjdjA4eGQycXFkajMyZ2kwaHkifQ.vWDLw3M_MZqzVmach-S0GA';

    constructor(){
        this.latMax = 85;
        this.latMin = -85;
        this.lonMax = 179.9;
        this.lonMin = -180;
        this.zoomMax = 19;
        this.zoomMin = 0;
    }

    /**
     * 如果tile url模板中含有reverseY字段，则在计算tile图片xy值时需要特殊处理
     * @returns {boolean}
     */
    @computed get reverseY(){
        if(this.tileUrlTemplate.includes('reverseY')){
            return true;
        }
        return false;
    }
    //存放每个zoom值由经纬度转换成的x y值
    //xyzList = [
    /**
     * {
             *      x:[min, max],
             *      y:[min, max],
             *      z:0
             * }
     */
    //];
    @computed get xyzList(){
        let xyzList = [];
        let {lon1, lon2, lat1, lat2, zoom1, zoom2} = this;
        if(zoom1 > zoom2){
            let tmp = zoom1;
            zoom1 = zoom2;
            zoom2 = tmp;
        }
        for(let z = zoom1; z <= zoom2; ++z){
            let res = [];
            res.push(computeTileXYZ(lon1, lat1, z, this.reverseY));
            res.push(computeTileXYZ(lon1, lat2, z, this.reverseY));
            res.push(computeTileXYZ(lon2, lat1, z, this.reverseY));
            res.push(computeTileXYZ(lon2, lat2, z, this.reverseY));
            let xmin = Number.MAX_VALUE;
            let ymin = Number.MAX_VALUE;
            let xmax = Number.MIN_VALUE;
            let ymax = Number.MIN_VALUE;
            for(let r of res){
                if(r.x > xmax){
                    xmax = r.x;
                }
                if(r.x < xmin){
                    xmin = r.x;
                }
                if(r.y > ymax){
                    ymax = r.y;
                }
                if(r.y < ymin){
                    ymin = r.y;
                }
            }
            xyzList.push({
                x: [xmin, xmax],
                y: [ymin, ymax],
                z
            });
        }
        return xyzList;
    }

    @computed get tileCount(){
        let tileCount = 0;
        this.xyzList.map(xyz => {
            tileCount += (xyz.x[1] - xyz.x[0] + 1) * (xyz.y[1] - xyz.y[0] + 1);
        });
        return tileCount;
    }

    handleChange = (key, range, value) => {
        if (Number.isNaN(Number(value))) {
            message.error(`请输入数字${(value)}`);
            return;
        }
        if (value < range[0] || value > range[1]) {
            message.error('输入值不在设定的范围内');
        }
        this[key] = Number(value);
    };

    @action modifyLonLat = (flag, lon, lat) => {
        this[`lon${flag}`] = lon;
        this[`lat${flag}`] = lat;
    }

    /**
     * 判断第一个点是否存在
     * @returns {boolean}
     */
    get isFirstPointNull(){
        return this.lon1 === 0 && this.lat1 === 0;
    }

    /**
     * 判断第二个点是否存在
     * @returns {boolean}
     */
    get isSecondPointNull(){
        return this.lon2 === 0 && this.lat2 === 0;
    }

    /**
     * 判断两个点位置是否重叠
     * @returns {boolean}
     */
    get isTwoPointOverap(){
        return (this.lon1 + this.lat1 + this.lon2 + this.lat2) > 0 && this.lon1 === this.lon2 && this.lat1 === this.lat2;
    }

    handleClick = () => {
        this.loadEnable = false;
        fetch(`/api/startLoad?downloadNum=${this.tileCount}&urlTemplate=${this.tileUrlTemplate}`).then(data => {
            let xyzArr = [
                /**
                 * {x: , y: , z: }
                 */
            ];
            for (let item of this.xyzList) {
                for (let x = item.x[0]; x <= item.x[1]; ++x) {
                    for (let y = item.y[0]; y <= item.y[1]; ++y) {
                        xyzArr.push({
                            x,
                            y,
                            z: item.z
                        });
                    }
                }
            }
            let index = 0;
            let timer = setInterval(()=>{
                if(index < xyzArr.length) {
                    let item = xyzArr[index];
                    let tileUrl = this.tileUrlTemplate.replace(/\{z\}\/\{x\}\/\{y\}|\{z\}\/\{x\}\/\{reverseY\}/g, `${item.z}/${item.x}/${item.y}`);
                    getUrl(tileUrl);
                    index++;
                } else {
                    clearInterval(timer);
                }
            }, 200);
        });
    };
}

export default new DataStore();