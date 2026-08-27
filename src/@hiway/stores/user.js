import { defineStore } from 'pinia'
import { getUserInfoBySession, loginByPassword, loginPass, logout } from '../api/login'
import { commonSearchApi, getCompanyList } from '@hiway/api/commonApi'
import { getClientIp } from '@hiway/api/utilsApi'
import { getButtonPermission } from '../api/user'
// import { getButtonPermission, getUserAuthGroups } from "../api/user"
import { useMenuStore } from './menu'
import { useTagsStore } from './tags'
import { removeToken } from '../utils/token'
import router from '@/router'
import EventHandler from '@hiway/utils/eventHandler'
import { forEach } from 'lodash-es'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '',
    userName: '',
    company: '',
    cmpnyDiv: '',
    bsnsCd: '',
    bsnsNm: '',
    asgnCd: '',
    asgnNm: '',
    asgnFullNm: '',
    deptCd: '',
    orgnDiv: '', //부서 조직구분 2025.04.01 김현재 추가 피복 모듈에서 로그인유저의 부서의 조직구분 코드가 필요해서 추가
    deptNm: '',
    jobTitCd: '',
    jobTitNm: '',
    jobRowCd: '', //직군코드 2025.01.17 김현재 추가 피복 모듈에서 사용자의 직군이 필요하기 때문에 추가
    jobRowNm: '', //직군명 2025.01.17 김현재 추가 피복 모듈에서 사용자의 직군이 필요하기 때문에 추가
    untDutyCd: '', //단위직무코드 2025.03.12 김현재 추가 보건-유해요인조사에서 로그인유저의 단위직무코드가 필요하기 때문에 추가
    offiResCd: '',
    role: '',
    email: '',
    userDiv: '',
    clientIp: '',
    empNo: '',
    empNm: '',
    telNo: '',
    hndPhn: '',
    companyNm: '',
    //ipAuthMenus: [],
    authGrpCd: [],
    buttonPermission: [],
    url: null,
  }),
  getters: {},
  actions: {
    loginByPassword(user_id, password) {
      return new Promise((resolve, reject) => {
        loginByPassword(user_id, password)
          .then((res) => {
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    loginPass(user_id, data) {
      return new Promise((resolve, reject) => {
        loginPass(user_id, data)
          .then((res) => {
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    setUserInfo() {
      return new Promise((resolve, reject) => {
        getClientIp().then((res) => {
          this.clientIp = res.body
        })

        getUserInfoBySession()
          .then(async (res) => {
            // 받아오는 값이 Array일 경우
            res = Array.isArray(res) ? res[0] : res
            this.userId = res.user_id
            this.userName = res.kor_nm
            this.company = res.customMap.company
            this.cmpnyDiv = res.customMap.company === '300' ? 'HHI' : res.customMap.company

            // 개발자 사번 회사코드 중공업으로 변경
            if (this.userId === 'BP16992' || this.userId === 'BP21926' || this.userId === 'BP17123') {
              this.cmpnyDiv = 'HHI'
            }
            this.authGrpCd = res.customMap.authGrpCd

            console.log(' res.customMap', res.customMap)
            console.log(' res.customMap', res.customMap.authGrpCd.includes('GRP00338'))
            var cmpny_whitelist = [
              '100', // HD한국조선해양
              '110', // 현대예술관
              '200', // HD현대일렉트릭
              //'210', // HD현대건설기계
              '220', // HD현대
              '240', // 현대중공업파워시스템
              '310', // HD현대마린솔루션
              '350', // 현대삼호중공업
              '380', // HD현대마린엔진
              '300', // HD현대중공업
              'HHI', // HD현대중공업
              '320', // HD현대사이트솔루션
              '1000', // 터보기계
              '2000', // HD현대엔진
              'ENT', // 이엔티
              '420' // 이엔티 A사번
            ]

            var grp_whitelist = [
              'GRP00338', // HD현대건설기계 임시 접속 가능자
            ]


             

            if (!cmpny_whitelist.includes(res.customMap.company) && ! res.customMap.authGrpCd.includes('GRP00338')) {

              alert('해당 계열사는 사용권한이 없습니다.')
              logout().then(() => {
                this.clear()
              })
            }

            this.jobTitCd = res.customMap.job_tit_cd
            this.jobTitNm = res.customMap.job_tit_nm
            this.offiResCd = res.customMap.offi_res_cd
            this.role = res.customMap.role
            await commonSearchApi({
              queryId: 'searchEMP',
              param: {
                CMPNY_DIV: this.cmpnyDiv,
                EMP_NO: this.userId,
                FLAG: 'N',
              },
            }).then((res2) => {
              // console.log('searchEMP', res2.ORESULT_CUR[0])
              if (res2.ORESULT_CUR.length === 1) {
                this.bsnsCd = res2.ORESULT_CUR[0].BSNS_CD
                this.bsnsNm = res2.ORESULT_CUR[0].BSNS_NM

                // ASGN_CD는 그대로 해야함 2024.03.20 박용훈
                // ASGN_CD는 직영이면 DEPT_CD값으로 협력사면 ASGN_CD값으로 매핑 되야함 - 2024.01.17 염인식
                //this.asgnCd = res2.ORESULT_CUR[0].USER_DIV === 'A' ? res2.ORESULT_CUR[0].DEPT_CD : res2.ORESULT_CUR[0].ASGN_CD
                this.asgnCd = res2.ORESULT_CUR[0].ASGN_CD
                this.asgnNm = res2.ORESULT_CUR[0].ASGN_SHRT_NM
                this.asgnFullNm = res2.ORESULT_CUR[0].ASGN_NM
                this.jobRowCd = res2.ORESULT_CUR[0].JOB_ROW_CD
                this.jobRowNm = res2.ORESULT_CUR[0].JOB_ROW_NM
                this.untDutyCd = res2.ORESULT_CUR[0].UNT_DUTY_CD
                this.deptCd = res2.ORESULT_CUR[0].DEPT_CD
                // this.deptNm = res2.ORESULT_CUR[0].DEPT_NM
                // DEPT_NM는 직영이면 DEPT_CD값으로 협력사면 ASGN_NM으로 매핑 되야함 - 2024.02.02 염인식
                this.deptNm = res2.ORESULT_CUR[0].DEPT_NM
                this.email = res2.ORESULT_CUR[0].EMAIL
                this.userDiv = res2.ORESULT_CUR[0].USER_DIV
                this.orgnDiv = res2.ORESULT_CUR[0].ORGN_DIV
                this.empNo = res2.ORESULT_CUR[0].EMP_NO
                this.empNm = res2.ORESULT_CUR[0].EMP_NM
                this.telNo = res2.ORESULT_CUR[0].TEL_NO
                this.hndPhn = res2.ORESULT_CUR[0].HND_PHN
                getCompanyList('HHIZ000').then((company) => {
                  company.ORESULT_CUR.forEach((item) => {
                    if (item.COD === res2.ORESULT_CUR[0].CMPNY_DIV) {
                      this.companyNm = item.TXT
                    }
                  })
                })

                nextTick(() => {
                  // const userInfo = useUserStore()

                  if (this.empNo !== undefined && this.empNo !== null && this.empNo !== '') {
                    let title = ''

                    title += '['

                    if (this.empNm) {
                      title += this.empNm
                    } else {
                      title += this.empNo
                    }

                    if (this.jobTitNm) {
                      title += `/${this.jobTitNm}`
                    }

                    title += ']'

                    document.title = 'HiSEs' + title
                  }
                })
              }
            })

            //테스트 - 안전경영부
            //this.company = '300'
            //this.cmpnyDiv = 'HHI'
            //this.bsnsCd = 'AN00'
            //this.asgnCd = 'N095'
            //this.deptCd = 'N090'
            //this.deptNm = '안전경영부'

            /*
          //테스트 - 생산부서
          //this.company = '300'
          //this.cmpnyDiv = 'HHI'
          this.bsnsCd = 'AN00'
          this.asgnCd = 'N095'
          this.deptCd = 'N090'
          this.deptNm = '안전경영부'
          */

            /*
          //테스트 - 단기공사
          //this.company = '300'
          //this.cmpnyDiv = 'HHI'
          this.bsnsCd = 'AN00'
          this.asgnCd = 'N095'
          this.deptCd = 'N090'
          this.deptNm = '안전경영부'
          */

            getButtonPermission().then((btnRes) => {
              if (!Array.isArray(btnRes)) btnRes = []
              this.buttonPermission = btnRes
              EventHandler.emit('loaded-permission')
              resolve()
            })

            // getUserAuthGroups(this.userId).then(uagRes => {
            //   if (!Array.isArray(uagRes)) uagRes = []
            //   // console.log('uagRes', uagRes)
            //   for(let uagResIdx = 0; uagResIdx < uagRes.length; uagResIdx++) {
            //     if(uagRes[uagResIdx].is_admin === 'Y') {
            //       this.isAdmin = 'Y'
            //       break
            //     }
            //   }
            //   EventHandler.emit("loaded-user-auth-groups")
            //   resolve()
            // })
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async getAuthIpMenus() {
      let menus = await commonSearchApi({
        queryId: 'OPRAE0010_SEARCH_03',
        param: {
          CMPNY_DIV: this.cmpnyDiv,
          EMP_NO: this.userId,
          CLIENT_IP: this.clientIp,
        },
      })

      return menus.ORESULT_CUR
    },
    reset() {
      this.userId = ''
      this.userName = ''
      this.company = ''
      this.cmpnyDiv = ''
      this.bsnsCd = ''
      this.bsnsNm = ''
      this.asgnCd = ''
      this.asgnNm = ''
      this.asgnFullNm = ''
      this.deptCd = ''
      this.deptNm = ''
      this.jobTitCd = ''
      this.jobTitNm = ''
      this.jobRowCd = ''
      this.jobRowNm = ''
      this.offiResCd = ''
      this.role = ''
      this.email = ''
      this.userDiv = ''
      ;(this.empNo = ''),
        (this.empNm = ''),
        (this.telNo = ''),
        (this.hndPhn = ''),
        //this.ipAuthMenus = []
        (this.authGrpCd = [])
      this.buttonPermission = []
    },
    logout() {
      logout().then(() => {
        this.clear()
      })
    },
    clear() {
      useMenuStore().reset()
      useTagsStore().reset()
      this.reset()
      removeToken()
      router.push('/')
      router.afterEach((to, from, next) => {
        window.location.reload()
      })
    },
  },
})
