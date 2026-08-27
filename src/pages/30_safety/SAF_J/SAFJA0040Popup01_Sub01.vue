<!--
  화면명 : 공사 신청 서브 화면1
  화면개요 : 공사 신청 서브 화면 기본정보 입력 화면
-->
<script setup>
import { ref, onMounted } from 'vue'
import { commonSearchApi } from '@/@hiway/api/commonApi'
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import Message from "@hiway/utils/notify";
import { isEmpty } from 'lodash-es'

//언어 토글
const i18n = useI18n();
const { t } = useI18n();


//담당자 확인 체크
const btnCheck = reactive({
  reqEmp: 'check',
  deptEmp: 'check',
  wrkEmp: 'check',
})


const emit = defineEmits(['close'])
//사용자 정보
const userStore = useUserStore();

//컨트롤 입력값 v-model
const itemList = ref([])
//금일날짜
const date = ''

const day = ref('')

const page1 = reactive(
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    BIZ_REG_NO: userStore.bizRegNo,
    WORK_TYPE: '1',    //공사타입   신규:1 , 인원추가: 2 , 공사복사:3''
    WORK_DESC: '',    //공사 명
    WORK_NO: '',      //공사 번호
    WORK_NO_NAME: '',      //공사 번호
    copyOut: '',      //과거 공사
    WORK_FROM_DT: date, //공사기간 시작일
    WORK_TO_DT: date,   //공사기간 종료일
    INSERT_USER_NM: '',   //작성자 성명
    INSERT_USER_TEL: '',  //작성자 연락처

    REQ_PIC_EMPNM: '',    //공사의뢰 부서 담당자 이름
    REQ_PIC_EMPNO: '',    //공사의뢰 부서 담당자 사번
    REQ_PIC_MOBILE: '',   //공사의뢰 부서 담당자 연락처
    REQ_DEPT_CD: '',      //공사의뢰 부서 담당자 부서
    REQ_PIC_PH: '',    //공사의뢰 부서 담당자 사번
    ISSUE_YN: 'Y', //출입증 발급

    DEPT_PIC_EMPNM: '',   //소속부서담당자 이름
    DEPT_PIC_EMPNO: '',   //소속부서담당자 사번
    DEPT_PIC_MOBILE: '',  //소속부서담당자 연락처
    DEPT_CD: '',          //소속부서담당자 부서
    DEPT_COMPANY: '',     //소속부서담당자 회사코드
    DEPT_PIC_PH: '',      //소속부서담당자 연락처
    DANGER_DIV: 'H',

    WORK_PIC_EMPNM: '', //공사 책임자 명
    WORK_PIC_MOBILE: '', //공사 책임자 연락처

    WRK_MNG_EMPNM: '',    //공사 관리부서 담당자 이름
    WRK_MNG_EMPNO: '',    //공사 관리부서 담당자 사번
    WRK_MNG_MOBILE: '',   //공사 관리부서 담당자 연락처
    WRK_MNG_COMPANY: '',    //공사 관리부서 담당자 회사
    WRK_MNG_ASGN_CD: '',    //공사 관리부서 담당자 소속
    WRK_MNG_DEPT_CD: '',    //공사 관리부서 담당자 부서
    WRK_MNG_PH: '',   //공사 관리부서 담당자 HP
    REQ_CHECK: false,   //공사의뢰부서 담당자 체크
    DEPT_CHECK: false,  //소속부서 담당자 체크
    WRK_CHECK: false,   //공사 관리부서 담당자 체크
    WRK_DIV: '',
    VEND_CD: '',
    REV_NO: '',
    SAVE_STEP: '0',
    STATUS: '10',
    groupInsrNo: userStore.groupInsrNo,
    injrInsrNo: userStore.injrInsrNo,

  }
)

const radio = ref('COPY')
const gubn = ref(true)

//페이지 오픈시, 처리
onMounted(() => {
  //comboSearch()
})


//입력데이터 부모로 전달.
const getData = () => {

  let resultData = ''
  resultData = page1

  return resultData
}

//부모로 부터 받은 데이터 전달
const setData = (data) => {
  console.log('data ', data)

  page1.STATUS = data.STATUS === '' ? '10' : data.STATUS
  page1.WRK_DIV = data.WRK_DIV
  if (data.WORK_NO == undefined) {
    return;
  } 

  page1.WORK_NO = data.WORK_NO
  page1.WORK_NO_NAME = data.WORK_NO_NAME
  page1.VEND_CD = data.VEND_CD
  page1.REV_NO = data.REV_NO
  // page1.WRK_DIV = data.WRK_DIV
  page1.WORK_DESC = data.WORK_DESC
  page1.WORK_FROM_DT = txtFomat('date',data.WORK_FROM_DT)
  page1.WORK_TO_DT = txtFomat('date', data.WORK_TO_DT)
  page1.ISSUE_YN = data.ISSUE_YN
  page1.DANGER_DIV = data.DANGER_DIV

  day.value = getDateDiff(data.WORK_FROM_DT, data.WORK_TO_DT) + 1 +'일'

  if(data.WORK_TYPE === '1'){
    radio.value = 'NEW'    
  } else if(data.WORK_TYPE === '2') {
    radio.value = 'PIC'
  } else {
    radio.value = 'COPY'
  }

  page1.WORK_TYPE = data.WORK_TYPE
  page1.INSERT_USER_NM = data.INSERT_USER_NM
  page1.INSERT_USER_TEL = txtFomat('ph', data.INSERT_USER_TEL)

  page1.WORK_PIC_EMPNM = data.WORK_PIC_EMPNM
  page1.WORK_PIC_MOBILE = txtFomat('ph', data.WORK_PIC_MOBILE)


  page1.REQ_PIC_EMPNM = data.REQ_PIC_NAME
  page1.REQ_PIC_EMPNO = data.REQ_PIC_EMPNO
  page1.REQ_PIC_PH = data.REQ_PIC_TEL

  page1.DEPT_PIC_EMPNM = data.DEPT_PIC_NAME
  page1.DEPT_PIC_EMPNO = data.DEPT_PIC_EMPNO
  page1.DEPT_PIC_PH = data.DEPT_PIC_TEL

  page1.WRK_MNG_EMPNM = data.WRK_MNG_EMPNM
  page1.WRK_MNG_EMPNO = data.WRK_MNG_EMPNO
  page1.WRK_MNG_PH = data.WRK_MNG_EMPTEL
}

//날짜 연락처 하이픈
const txtFomat = (div, txt) => {
  let result = ''

  if (isEmpty(txt)) {
    return result
  }
  if (div === 'ph') {
    if (txt.length === 11) {
      result = txt.substr(0, 3)+'-'+txt.substr(3,4)+'-'+txt.substr(7,4)  
    }
  } else if (div === 'date') {
    
    if (txt.length === 8) {
      result = txt.substr(0, 4)+'-'+txt.substr(4,2)+'-'+txt.substr(6,2)  
    } 
  }

  if(result.indexOf('-') < 0) {
      result = txt
    }

  return result;
  
}

const modeChange = () => {

  comboSearch()

  if (radio.value === 'COPY') {
    page1.WORK_TYPE = '3'    
  } else if (radio.value === 'PIC') {
    page1.WORK_TYPE = '2'    
  } else {
    page1.WORK_TYPE = '1'    
  }
  
}

//콤보박스 조회
const comboSearch = () => {
  //진행상태 콤보 데이터 조회
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_03",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      BIZ_REG_NO: page1.BIZ_REG_NO,
      WORK_NO: '',
      WORK_DESC: '',
      GUBUN: radio.value,   //COPY 신규, PIC 인원추가
    },
  }).then(res => { 
    if (res.ORESULT_CUR.length > 0 && radio.value === 'PIC') {
      itemList.value = res.ORESULT_CUR
      itemList.value.unshift({NAME: '선택' , CODE: ''})  
    } else if (res.ORESULT_CUR.length === 0 && radio.value === 'PIC') {
    
      itemList.value = [{
        NAME: '복사할 공사가 존재하지 않습니다.',
        CODE: '%'
      }]

    } else if (res.ORESULT_CUR.length > 0 && radio.value === 'COPY') {
      itemList.value = res.ORESULT_CUR
      itemList.value.unshift({NAME: '선택' , CODE: ''})  
    } else if (res.ORESULT_CUR.length === 0 && radio.value === 'COPY') { 
      itemList.value = [{
        NAME: '공사진행중인 공사가 존재하지 않습니다.',
        CODE: '%'
      }]
    }

    page1.copyOut = '%'
    
  })
}

// 날짜 차이 계산
const getDateDiff = (d1, d2) => {
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  
  const diffDate = date1.getTime() - date2.getTime()
  
  return Math.abs(diffDate / (1000 * 60 * 60 * 24)) // 밀리세컨 * 초 * 분 * 시 = 일
}

const chkBtn = async (nm, tel, gb) => {

  const checkVal = {
    empNo: '',    //담당자 이름 
    hndPhn: '',   //담당자 연락처
    classNm: '',  //체크 담당자 버튼 색 변경
    check: false, //체크 처리된 데이터 저장
  }

  if (nm.length > 0) {
    if (tel.length === 4) {
      
      //연락처 조회 및 담당자 정보 유효한지 처리
      await commonSearchApi({
        queryId: "OUTBA0020_SEARCH_04",
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          EMPNM: nm,
          TELNO: tel,
        },
      }).then(async res => { 
        if (res.ORESULT_CUR.length == 1) {
          checkVal.empNo = res.ORESULT_CUR[0].EMP_NO
          checkVal.hndPhn = res.ORESULT_CUR[0].HND_PHN
          checkVal.classNm = ''
          checkVal.check = true
          Message.success('담당자가 확인 되었습니다.')
        } else {
          checkVal.classNm = 'error'
          Message.warn('담당자정보를 확인해 주십시오.')
        }

      })  

    } else {
      checkVal.classNm = 'error'
      Message.err('잘못된 연락처 입니다.')
    }
  } else {
    checkVal.classNm = 'error'
    Message.err('담당자 이름은 필수입니다.')
  }

  //버튼 클릭별로 check 값 전달
  if (gb === 0) {
    page1.REQ_PIC_EMPNO = checkVal.empNo
    page1.REQ_PIC_MOBILE = checkVal.hndPhn
    btnCheck.reqEmp = checkVal.classNm
    page1.REQ_CHECK = checkVal.check
  } else if (gb === 1) {
    page1.DEPT_PIC_EMPNO = checkVal.empNo
    page1.DEPT_PIC_MOBILE = checkVal.hndPhn
    btnCheck.deptEmp = checkVal.classNm
    page1.DEPT_CHECK = checkVal.check
  } else {
    page1.WRK_MNG_EMPNO = checkVal.empNo
    page1.WRK_MNG_MOBILE = checkVal.hndPhn
    btnCheck.wrkEmp = checkVal.classNm
    page1.WRK_CHECK = checkVal.check
  }

}

//담당자 정보 입력란 데이터 변경시 처리
const valueChange = async(e) => {
  if (e === 0) {
    page1.REQ_CHECK = false
    btnCheck.reqEmp = 'check'
  } else if(e===1){
    page1.DEPT_CHECK = false
    btnCheck.deptEmp = 'check'
  } else if (e === 2) {
    page1.WRK_CHECK = false
    btnCheck.wrkEmp = 'check'
  }
}

//공사기간 입력란 데이터 변경시 처리
const dateChange = async (e) => {
  const startDt = page1.WORK_FROM_DT.replaceAll('-','')
  const endDt = page1.WORK_TO_DT.replaceAll('-', '')

  if (startDt > endDt) {
    Message.err('공사기간이 잘못 되었습니다.')
    page1.WORK_TO_DT = page1.WORK_FROM_DT
  }

  // const diff = getDateDiff(page1.WORK_FROM_DT, page1.WORK_TO_DT)
  // day.value = diff+1+'일'

}

// 현재 날짜 자동 입력 
const getToday = () => {
  // 현재 날짜 객체 생성
  var today = new Date()
  // 년, 월, 일을 가져오기
  var year = today.getFullYear()
  // 월은 0부터 시작하기 때문에 1을 더해줌
  var month = (today.getMonth() + 1).toString().padStart(2, '0') // 1자리 숫자는 앞에 0을 붙여 두 자리로 만듦
  var day = today.getDate().toString().padStart(2, '0') // 위와 동일
  return year + '-' + month + '-' + day
}


const copyData = () => {
  //진행상태 콤보 데이터 조회
  let data = page1.copyOut.split(',');

  if (data.length < 3) {
    return;
  }
  commonSearchApi({
      queryId: "OUTBA0020_SEARCH_05",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BIZ_REG_NO: userStore.bizRegNo,
        VEND_CD: data[0],
        WORK_NO: data[1],
        REV_NO: data[2],
      },
    }).then(res => { 
      res.ORESULT_CUR[0].WORK_NO = ''
      res.ORESULT_CUR[0].REV_NO = ''
      res.ORESULT_CUR[0].VEND_CD = ''

      res.ORESULT_CUR[0].REQ_PIC_EMPNM = ''
      res.ORESULT_CUR[0].REQ_PIC_EMPNO = ''
      res.ORESULT_CUR[0].REQ_PIC_PH = ''

      res.ORESULT_CUR[0].DEPT_PIC_EMPNM = ''
      res.ORESULT_CUR[0].DEPT_PIC_EMPNO = ''
      res.ORESULT_CUR[0].DEPT_PIC_PH = ''

      res.ORESULT_CUR[0].WRK_MNG_EMPNM = ''
      res.ORESULT_CUR[0].WRK_MNG_EMPNO = ''
      res.ORESULT_CUR[0].WRK_MNG_PH = ''

      btnCheck.reqEmp = 'check'
      btnCheck.deptEmp = 'check'
      btnCheck.wrkEmp = 'check'

      setData(res.ORESULT_CUR[0])

    })
}

//출입증 발급 체크 해제 문구
const issueYnChk = (e) => {
  if (e === 'N') {
    Message.warn(t('OUTBA0020.출입증 발급 문구1') + '<br/>' + t('OUTBA0020.출입증 발급 문구2'))
  }
}

const comboList = () => {
  //인원 추가 일때 작동.
  if (radio.value === 'PIC') {

    let data = page1.copyOut.split(',')
    if (data.length < 3) {
      return;
    }

    commonSearchApi({
      queryId: "OUTBA0020_SEARCH_05",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BIZ_REG_NO: userStore.bizRegNo,
        VEND_CD: data[0],
        WORK_NO: data[1],
        REV_NO: data[2],
      },
    }).then(res => { 
      res.ORESULT_CUR[0].REQ_PIC_EMPNM = ''
      res.ORESULT_CUR[0].REQ_PIC_EMPNO = ''
      res.ORESULT_CUR[0].REQ_PIC_PH = ''

      res.ORESULT_CUR[0].DEPT_PIC_EMPNM = ''
      res.ORESULT_CUR[0].DEPT_PIC_EMPNO = ''
      res.ORESULT_CUR[0].DEPT_PIC_PH = ''

      res.ORESULT_CUR[0].WRK_MNG_EMPNM = ''
      res.ORESULT_CUR[0].WRK_MNG_EMPNO = ''
      res.ORESULT_CUR[0].WRK_MNG_PH = ''

      btnCheck.reqEmp = 'check'
      btnCheck.deptEmp = 'check'
      btnCheck.wrkEmp = 'check'

      setData(res.ORESULT_CUR[0])

    })
  }
  
}

defineExpose({ getData, setData })
</script>

<template>
<!-- <v-row no-gutters class="pa-0"> -->
  <div class="fill-height">
    <i-card min-width="800">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="align-center pB-10">
          <span class="formLabelText d-flex">신청 종류</span>
          <v-radio-group inline v-model="radio" class="radioGroup" readonly>
            <v-radio color="primary" label="신규" :value="'NEW'" class="mr-4"></v-radio>
            <v-radio color="primary" label="진행중공사 인원추가" :value="'PIC'"></v-radio>
            <v-radio color="primary" label="과거공사 복사/사용" :value="'COPY'"></v-radio>
          </v-radio-group>
          <i-select
              class="pl-5 mr-1"
              v-model="page1.copyOut"
              :items="itemList" 
              :label="page1.WORK_TYPE === '3' ? t('과거 공사') : t('진행중 공사')"
              @update:model-value="comboList()"
              readonly
              width="680px" 
              labelWidth="80px"
              item-value="CODE"
              item-title="NAME"
              v-if="false"
              />
          <v-btn v-if="false"  height="35" elevation="0" color="btnSecondary" 
            @click="copyData()" :disabled="page1.STATUS === '10' ? false : true">{{ t('공사복사') }}</v-btn>
        </v-row>
        <v-row no-gutters class="pB-10" v-if="page1.WORK_TYPE === '2'">
          <span class="formLabelText d-flex">위험작업허가</span>
          <v-radio-group inline v-model="page1.DANGER_DIV" class="radioGroup" readonly>
            <v-radio color="primary" label="신청" :value="'H'" class="mr-4"></v-radio>
            <v-radio color="primary" label="미신청" :value="'N'"></v-radio>            
          </v-radio-group>
        </v-row>        
        <v-row no-gutters class="pB-10">
          <i-input 
            v-model="page1.WORK_DESC" 
            readonly
            width="700px" 
            labelWidth="100px" 
            :label="t('공사명')" 
            required
          />
          <i-input 
            :label="t('공사번호')"
            v-model="page1.WORK_NO_NAME"
            width="337px"
            labelWidth="100px"
            readonly
            required/>
        </v-row>
        <v-row no-gutters class="align-center">
          <i-input 
            type="date" 
            v-model="page1.WORK_FROM_DT" 
            readonly
            width="260px" 
            labelWidth="100px" 
            :label="t('공사기간')" 
            class="mr-2"
            @update:modelValue="dateChange"
          />
          <i-input 
            type="date" 
            v-model="page1.WORK_TO_DT"  
            readonly
            width="170px" 
            labelWidth="10px"  
            :label="t('-')"
            @update:modelValue="dateChange"
          />
          <i-input 
            v-model="day" 
            width="70px" 
            labelWidth="0px" 
            :label="t('')" 
            readonly 
          />
          <div style="width: 290px;">
            <span style="color: red;" v-if="getDateDiff(page1.WORK_FROM_DT, page1.WORK_TO_DT) + 1 < 15 ">{{t('방문출입증 발급대상(각 출입문 발급)')}}</span>
            <span style="color: red;" v-else>{{t('업무지원출입증 발급대상')}}</span>
          </div>
          <v-checkbox @update:modelValue="issueYnChk" true-value="Y" false-value="N" :label="t('출입증 발급')" v-model="page1.ISSUE_YN" style='max-height: 40 !important;'/>
        </v-row>
      </v-col>
    </i-card>

    <i-card :title="t('공사책임자/작성자 정보')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row class="mb-4" no-gutters>
          <i-input 
            v-model="page1.WORK_PIC_EMPNM"
            readonly
            :label="t('공사책임자성명')" 
            width="337px" 
            labelWidth="110px" 
            dot 
            required
          >
          </i-input>
          <i-input 
            v-model="page1.WORK_PIC_MOBILE"
            readonly
            :label="t('책임자휴대폰')"  
            width="320px" 
            labelWidth="160px" 
            class="pl-5" 
            dot 
            required
          >
          </i-input>
        </v-row>
        <v-row no-gutters>
          <i-input 
            v-model="page1.INSERT_USER_NM"
            readonly
            :label="t('작성자성명')" 
            width="337px" 
            labelWidth="110px" 
            dot 
            required
          >
          </i-input>
          <i-input 
            v-model="page1.INSERT_USER_TEL"
            readonly
            :label="t('작성자 연락처')"  
            width="320px" 
            labelWidth="160px" 
            class="pl-5" 
            dot 
            required
          >
          </i-input>
        </v-row>
        
      </v-col>
    </i-card>

    <i-card :title="t('출입신청부서 담당자정보')" :caption="t('단기공사 신청 시 출입신청 관련 업무 담당자 지정 (공사 승인 등)')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base detail1">

        <v-row no-gutters>
          <i-input 
            dot 
            v-model="page1.REQ_PIC_EMPNM" 
            readonly
            :label="t('담당자성명')" 
            width="337px" 
            labelWidth="110px" 
            @update:modelValue="valueChange(0)"
            required
          />
          <i-input 
            dot 
            v-model="page1.REQ_PIC_PH"
            readonly
            :label="t('휴대폰 마지막 4자리')"   
            width="320px" 
            labelWidth="160px" 
            class="pl-5" 
            @update:modelValue="valueChange(0)"
            required
          />
          <v-btn class="ml-1" @click="chkBtn(page1.REQ_PIC_EMPNM, page1.REQ_PIC_PH,0)" 
            :class="btnCheck.reqEmp === 'check' ? '' : btnCheck.reqEmp === 'error' ? 'errorColor' : 'succesColor'" 
            height="35" elevation="0" color="btnSecondary">{{ t('확인') }}
          </v-btn>
        </v-row>
        
      </v-col>
    </i-card>

    <i-card class="pb-5" :title="page1.WRK_DIV === 'S' ? t('공사담당부서 담당자정보') : t('공사발주부서 담당자정보')" :caption="t('공사를 요청한 부서의 담당자 지정 (안전교육, 공사의 공정 등 전반적인 관리)')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base detail2">

        <v-row no-gutters >
          <i-input 
            v-model="page1.DEPT_PIC_EMPNM" 
            readonly
            :label="t('담당자성명')" 
            width="337px" 
            labelWidth="110px" 
            @update:modelValue="valueChange(1)"
          />
          <i-input 
            v-model="page1.DEPT_PIC_PH" 
            :label="t('휴대폰 마지막 4자리')"
            readonly
            width="320px" 
            labelWidth="160px" 
            class="pl-5" 
            @update:modelValue="valueChange(1)"
          />
          <v-btn class="ml-1" @click="chkBtn(page1.DEPT_PIC_EMPNM, page1.DEPT_PIC_PH,1)" 
                :class="btnCheck.deptEmp === 'check' ? '' : btnCheck.deptEmp === 'error' ? 'errorColor' : 'succesColor'" 
                height="35" elevation="0" color="btnSecondary">{{ t('확인') }}
          </v-btn>
          <!-- <v-btn @click="chkBtn(page1.DEPT_PIC_EMPNM, page1.DEPT_PIC_PH,1)" class="ml-1" height="35" elevation="0" color="btnSecondary">{{ t('확인') }}</v-btn> -->
        </v-row>
        
      </v-col>
    </i-card>
    <!-- <popup01 @returnData="popReturnVal" ref="BA0020POP"> </popup01> -->
  <!-- </v-row> -->
</div>
</template>

<style scoped lang="scss">
.succesColor {
  background: #00f549 !important;
  color: #000;
}

.errorColor {
  background: #f58300 !important;
  color: #fff;
}

.formLabelText {
  inline-size: 110px;
}

.radioGroup {
  max-inline-size: 427px;
}

.leftCard {
  max-inline-size: 420px !important;
}

.textareaCol {
  max-inline-size: 515px;
  min-inline-size: 515px;

  &:has(.end) {
    max-inline-size: 535px;
    min-inline-size: 535px;
  }
}

.detail2 {
  position: relative;

  &::before {
    position: absolute;
    color: rgb(var(--v-theme-inputCheck));
    content: "※출입신청부서 담당자와 다를 경우만 입력바랍니다.";
    font-size: 12px;
    font-weight: 300;
    letter-spacing: -0.03em;
    transform: translate(0, -100%);
    white-space: nowrap;
  }
}

.detail3 {
  position: relative;

  &::before {
    position: absolute;
    color: rgb(var(--v-theme-inputCheck));
    content: "※공사담당부서 담당자와 다를 경우만 입력바랍니다.";
    font-size: 12px;
    font-weight: 300;
    letter-spacing: -0.03em;
    transform: translate(0, -100%);
    white-space: nowrap;
  }
}
</style>


<route lang="yaml">
  meta:
    noAuth: true
  </route>
