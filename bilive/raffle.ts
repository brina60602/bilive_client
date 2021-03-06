import * as request from 'request'
import * as tools from './lib/tools'
import { AppClient } from './lib/app_client'
import { apiLiveOrigin, smallTVPathname, rafflePathname, lightenPathname, userData } from './index'
/**
 * 自动参与抽奖
 * 
 * @export
 * @class Raffle
 */
export class Raffle {
  /**
   * 创建一个 Raffle 实例
   * @param {raffleOptions} raffleOptions
   * @memberof Raffle
   */
  constructor(raffleOptions: raffleOptions) {
    this._raffleId = raffleOptions.raffleId
    this._roomID = raffleOptions.roomID
    this._jar = raffleOptions.jar
    this._userData = raffleOptions.userData
  }
  /**
   * 参与ID
   * 
   * @private
   * @type {number}
   * @memberof Raffle
   */
  private _raffleId: number
  /**
   * 房间号
   * 
   * @private
   * @type {number}
   * @memberof Raffle
   */
  private _roomID: number
  /**
   * CookieJar
   * 
   * @private
   * @type {request.CookieJar}
   * @memberof Raffle
   */
  private _jar: request.CookieJar
  /**
   * userData
   * 
   * @private
   * @type {userData}
   * @memberof Raffle
   */
  private _userData: userData
  /**
   * 抽奖地址
   * 
   * @private
   * @type {string}
   * @memberof Raffle
   */
  private _url: string
  /**
   * 参与小电视抽奖
   * 
   * @memberof Raffle
   */
  public SmallTV() {
    this._url = apiLiveOrigin + smallTVPathname
    return this._Raffle()
  }
  /**
   * 参与抽奖
   * 
   * @memberof Raffle
   */
  public Raffle() {
    this._url = apiLiveOrigin + rafflePathname
    this._appLighten().catch(error => { tools.Error(this._userData.nickname, error) })
    return this._Raffle()
  }
  /**
   * 抽奖
   * 
   * @private
   * @memberof Raffle
   */
  private async _Raffle() {
    let join: request.Options = {
      uri: `${this._url}/join?roomid=${this._roomID}&raffleId=${this._raffleId}`,
      jar: this._jar,
      json: true,
      headers: {
        'Referer': `https://live.bilibili.com/${this._roomID}`
      }
    }
      , raffleJoin = await tools.XHR<raffleJoin>(join)
    if (raffleJoin.response.statusCode === 200 && raffleJoin.body.code === 0) {
      let time = raffleJoin.body.data.time * 1e+3 + 3e+4
      await tools.Sleep(time)
      this._RaffleReward()
    }
  }
  /**
   * app快速抽奖
   * 
   * @private
   * @memberof Raffle
   */
  private async _appLighten() {
    let baseQuery = `access_key=${this._userData.accessToken}&${AppClient.baseQuery}`
      , reward: request.Options = {
        uri: `${apiLiveOrigin}/YunYing/roomEvent?${AppClient.ParamsSign(`event_type=openfire-${this._raffleId}&room_id=${this._roomID}&${baseQuery}`)}`,
        json: true
      }
      , appLightenReward = await tools.XHR<appLightenReward>(reward, 'Android')
    if (appLightenReward.response.statusCode === 200 && appLightenReward.body.code === 0) tools.Log(this._userData.nickname, `抽奖 ${this._raffleId} `, `获得${appLightenReward.body.data.gift_desc}`)
  }
  /**
   * 获取抽奖结果
   * 
   * @private
   * @memberof Raffle
   */
  private async _RaffleReward() {
    let reward: request.Options = {
      uri: `${this._url}/notice?roomid=${this._roomID}&raffleId=${this._raffleId}`,
      jar: this._jar,
      json: true,
      headers: {
        'Referer': `https://live.bilibili.com/${this._roomID}`
      }
    }
      , raffleReward = await tools.XHR<raffleReward>(reward)
    if (raffleReward.response.statusCode !== 200) return
    if (raffleReward.body.code === -400 || raffleReward.body.data.status === 3) {
      await tools.Sleep(3e+4)
      this._RaffleReward()
    }
    else {
      let gift = raffleReward.body.data
      if (gift.gift_num === 0) tools.Log(this._userData.nickname, `抽奖 ${this._raffleId} `, raffleReward.body.msg)
      else tools.Log(this._userData.nickname, `抽奖 ${this._raffleId} `, `获得 ${gift.gift_num} 个${gift.gift_name}`)
    }
  }
  /**
   * 参与快速抽奖
   * 
   * @memberof Raffle
   */
  public async Lighten() {
    this._url = apiLiveOrigin + lightenPathname
    let getCoin: request.Options = {
      method: 'POST',
      uri: `${this._url}/getCoin`,
      body: `roomid=${this._roomID}&lightenId=${this._raffleId}}`,
      jar: this._jar,
      json: true,
      headers: {
        'Referer': `https://live.bilibili.com/${this._roomID}`
      }
    }
      , lightenReward = await tools.XHR<lightenReward>(getCoin)
        .catch((reject) => { tools.Error(this._userData.nickname, reject) })
    if (lightenReward != null && lightenReward.body.code === 0) tools.Log(this._userData.nickname, `抽奖 ${this._raffleId} `, lightenReward.body.msg)
  }
}
/**
 * 抽奖设置
 * 
 * @export
 * @interface raffleOptions
 */
export interface raffleOptions {
  raffleId: number
  roomID: number
  userData: userData
  jar: request.CookieJar
}
/**
/**
 * 参与抽奖信息
 * 
 * @interface raffleJoin
 */
interface raffleJoin {
  code: number
  msg: string
  message: string
  data: raffleJoinData
}
interface raffleJoinData {
  face?: string
  from: string
  type: 'small_tv' | string
  roomid?: string
  raffleId: number | string
  time: number
  status: number
}
/**
 * 抽奖结果信息
 * 
 * @interface raffleReward
 */
interface raffleReward {
  code: number
  msg: string
  message: string
  data: raffleRewardData
}
interface raffleRewardData {
  gift_id: number
  gift_name: string
  gift_num: number
  gift_from: string
  gift_type: number
  gift_content: string
  status?: number
}
/**
 * 快速抽奖结果信息
 * 
 * @interface lightenReward
 */
interface lightenReward {
  code: number
  msg: string
  message: string
  data: [number]
}
/**
 * App快速抽奖结果信息
 * 
 * @interface appLightenReward
 */
interface appLightenReward {
  code: number
  msg: string
  message: string
  data: appLightenRewardData
}
interface appLightenRewardData {
  gift_img: string
  gift_desc: string
}