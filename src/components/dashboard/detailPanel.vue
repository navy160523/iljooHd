<!-- 
  * Vue 내 용 : 통합안전 Dashboard Detail
  * 작 성 자 : 일주지앤에스 박성학
  * 최초 작성일 : 2024/05/03
  * 최종 수정자 : 일주지앤에스 박성학
  * 최종 수정일 : 2024/05/03
-->

<script setup>
import dayjs from "dayjs"
import { commonSearchApi } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import SAFCD0010Tab03Popup01 from '@/pages/30_safety/SAF_C/SAFCD0010Tab03Popup01_DASHBOARD.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: null },
  dtype: { type: String, default: null },
  list: { type: Array, required: true },
})

const emit = defineEmits(['clickClose'])
const sAFCD0010Tab03Popup01 = ref(null)
// data set
const listA = ref([])
const listB = ref([])
const listC = ref([])
const listE = ref([])
const listF = ref([])
const detailPage = ref(false)
const dataForm = ref([])
const images = ref([])
const slide = ref(0)
const checkG0 = ref(0)
const checkG1 = ref(0)
const checkG2 = ref(0)
const checkG3 = ref(0)

const fileParams = ref({})

// 안전사고
const accidentForm = ref([
  // { imgList: ['noImg.png', 'noImg.png', 'noImg.png'] },
  // { label: '일시', text: '2024-01-01 02:24' },
  // { label: '재해자 소속', text: '안전경영부' },
  // { label: '재해자', text: '윤찬양 책임' },
  // { label: '사고 구분', text: '산재', subText: '중대성사고' },
  // { label: '사고 유형', chip: '떨어짐', color: 'dashDetailChip' },
  // { label: '장소', text: '1야드 1PE장' },
  // { label: '내용', textArea: '1야드 1PE장' },
])

// 안전 일반 점검
const inspectDailyForm = ref([
  { imgList: ['noImg.png', 'noImg.png', 'noImg.png'] },
  { label: '점검 결과', chip: '안전', color: 'primary' },
  { label: '점검 유형', text: '일반점검' },
  { label: '일시', text: '2024-01-01 02:24' },
  { label: '점검자 소속', text: '안전경영부' },
  { label: '점검자', text: '윤찬양 책임' },
  { label: '장소', text: '1야드 1PE장' },
  { label: '점검 내용', textArea: '곤돌라 점검' },
])

// 안전 부서관리작업 점검
const inspectPlanForm = ref([
  { imgList: ['noImg.png', 'noImg.png', 'noImg.png'] },
  {
    label: '점검 결과',
    hrztlList: [
      { label: '점검', data: 52 },
      { label: '양호', data: 50 },
      { label: '미흡', data: 2 },
    ],
  },
  { label: '점검 유형', text: '부서관리 작업' },
  { label: '일시', text: '2024-01-01 02:24' },
  { label: '점검자 소속', text: '안전경영부' },
  { label: '점검자', text: '윤찬양 책임' },
  { label: '장소', text: '1야드 1PE장' },
  { label: '점검 주제', text: '곤돌라 점검' },
])

// 안전 PTW 점검
const inspectPTWForm = ref([
  {
    label: '점검 현황',
    vrtclList: [
      { class: '관리감독자', label: '양호', name: '홍길동', time: '10:45 AM' },
      { class: 'Safe클로버', label: '미흡', name: '제갈량', time: '10:52 AM' },
      { class: '안전요원', label: '-', name: '-', time: '-' },
    ],
  },
  { label: '점검 유형', text: '고위험점검' },
  { label: '일시', text: '2024-01-01 02:24' },
  { label: '장소', text: '1야드 1PE장' },
])

// 안전 수칙 위반
const rulesForm = ref([
  // { label: '일시', text: '2024-01-01 02:24' },
  // { label: '위반자', text: '안전경영부 윤찬양 책임' },
  // { label: '장소', text: '1야드 1PE장' },
  // { label: '점검자', text: '윤찬양 책임' },
  // { label: '구분', text: '절대수칙' },
  // { label: '내용', textArea: '1야드 1PE장' },
])


const propsType = computed(() => {
  return props.type
})

const propsList = computed(() => {
  return props.list
})

watch(propsList, list => {
  detailPage.value = false
  listA.value = []
  listB.value = []
  listC.value = []
  listE.value = []
  listF.value = []
  console.log('watch list', props.dtype, list)
  if(!props.dtype) {
    if(props.type === 'accident') {
      list.forEach(item => {
        item.code1 = item.SAGO_DIV_L_NM + ' - ' + item.SAGO_DIV_M_NM + ' - ' + item.SAGO_DIV_S_NM
        // item.code1 = item.SAGO_DIV_M_NM
        item.code2 = item.SAGO_LOC_NM
        item.code3 = dayjs(item.OCCUR_DT + item.OCCUR_TIME).format('YYYY.MM.DD HH:mm')

        if(item.COME_SERIOUS_YN === 'Y') {
          item.code4 = '중대성사고'
          item.color4 = '#BE2E22'
        }

        if(item.JUNGDAE_YN === 'Y') {
          item.code5 = '중대재해'
          item.color5 = '#BE2E22'
        }

        if(item.SAGO_TYPE_CD === 'SJE') {
          listA.value.push(item)
        } else if(item.SAGO_TYPE_CD === 'GMS' || item.SAGO_TYPE_CD === 'HRS') {
          listB.value.push(item)
        } else if(item.SAGO_TYPE_CD === 'SNE' || item.SAGO_TYPE_CD === 'NON'  || item.SAGO_TYPE_CD === null) {
          listC.value.push(item)
        }
      })
    } else if(props.type === 'inspect') {
      list.forEach(item => {
        if(item.JOB_TYPE === 'ptw' || item.JOB_TYPE === 'ptwe') {
          item.code1 = item.WORK_TITLE
          item.code2 = item.AREA_NM
          item.code3 = dayjs(item.WORK_DATE).format('YYYY.MM.DD HH:mmZ')
          item.code7 = item.FST_INSERT_DATE ? item.FST_INSERT_DATE  : 'X'
          switch (item.STATUS) {
          case 'C':
            item.code4 = '점검완료'
            item.color4 = '#80FF00'
            break
          case 'P':
            item.code4 = '점검 진행중'
            item.color4 = '#FAE100'
            break
          case 'N':
            item.code4 = '점검 미완료'
            item.color4 = '#BE2E22'
            break
          }
          item.code6 = item.DEPT_NM

          item.ASGN_SNM !== null ? item.code6 = item.code6 + ' ' + item.ASGN_SNM : ''
          listA.value.push(item)
        } else if(item.JOB_TYPE === 'plan') {
          item.code1 = item.WORK_TITLE
          item.code2 = item.AREA_NM
          item.code3 = dayjs(item.WORK_DATE).format('YYYY.MM.DD HH:mm[Z]')
          switch (item.STATUS) {
          case 'C':
            item.code4 = '점검완료'
            item.color4 = '#80FF00'
            break
          case 'P':
            item.code4 = '점검 진행중'
            item.color4 = '#FAE100'
            break
          case 'N':
            item.code4 = '점검 미완료'
            item.color4 = '#BE2E22'
            break
          }
          item.code6 = item.DEPT_NM
          item.ASGN_SNM !== null ? item.code6 = item.code6 + ' ' + item.ASGN_SNM : ''
          listB.value.push(item)
        } else if(item.JOB_TYPE === 'daily') {
          // item.code1 = item.CHECK_DESC
          item.code2 = item.AREA_NM
          item.code3 = dayjs(item.CHECK_DATE).format('YYYY.MM.DD HH:mm')
          switch (item.CHECK_GUBUN) {
          case '0':
            item.color4 = '#BE2E22'
            break
          case '1':
            item.color4 = '#80FF00'
            break
          }
          item.code4 = item.CHECK_GUBUN_NM
          item.code6 = item.BSNS_NM + ' - ' + item.DEPT_NM
          listC.value.push(item)
        }
      })
    } else if(props.type === 'rules') {
      list.forEach(item => {
        item.code1 = item.VIO_MDIV_NM
        item.code2 = item.VIO_SPLC_NM
        item.code3 = dayjs(item.VIO_TIME).format('YYYY.MM.DD HH:mm')

        if(item.VIO_GDIV === 'A') {
          listA.value.push(item)
        } else if(item.VIO_GDIV.indexOf('D') > -1) {
          listB.value.push(item)
        } else if(item.VIO_GDIV === 'B') {
          listC.value.push(item)
        } else if(item.VIO_GDIV === 'E') {
          listE.value.push(item)
        } else if(item.VIO_GDIV === 'F') {
          listF.value.push(item)
        }
      })
    }
  } else {
    list.forEach(item => {
      if(props.type === 'accident') {
        item.code1 = item.SAGO_DIV_L_NM + ' - ' + item.SAGO_DIV_M_NM + ' - ' + item.SAGO_DIV_S_NM
        item.code2 = item.SAGO_LOC_NM
        item.code3 = dayjs(item.OCCUR_DT + item.OCCUR_TIME).format('YYYY.MM.DD HH:mm')
        if(item.COME_SERIOUS_YN === 'Y') {
          item.code4 = '중대성사고'
          item.color4 = '#BE2E22'
        }

        if(item.JUNGDAE_YN === 'Y') {
          item.code5 = '중대재해'
          item.color5 = '#BE2E22'
        }

        if(item.SAGO_TYPE_CD === 'SJE') {
          listA.value.push(item)
        } else if(item.SAGO_TYPE_CD === 'GMS' || item.SAGO_TYPE_CD === 'HRS') {
          listB.value.push(item)
        } else if(item.SAGO_TYPE_CD === 'SNE' || item.SAGO_TYPE_CD === 'NON'  || item.SAGO_TYPE_CD === null) {
          listC.value.push(item)
        }
        
      } else if(props.type === 'inspect') {
        // console.log('dtype', props.dtype)
        if(props.dtype === 'daily') {
          // item.code1 = item.CHECK_DESC
          item.code2 = item.AREA_NM
          item.code3 = dayjs(item.CHECK_DATE).format('YYYY.MM.DD HH:mm')
          switch (item.CHECK_GUBUN) {
          case '0':
            item.color4 = '#BE2E22'
            break
          case '1':
            item.color4 = '#80FF00'
            break
          }
          item.code4 = item.CHECK_GUBUN_NM
          item.code6 = item.BSNS_NM + ' - ' + item.DEPT_NM

          if(item.JOB_TYPE === 'daily')
            listC.value.push(item)

        } else {
          item.code1 = item.WORK_TITLE
          item.code2 = item.AREA_NM
          item.code3 = dayjs(item.WORK_DATE).format('YYYY.MM.DD HH:mm')
          switch (item.STATUS) {
          case 'C':
            item.code4 = '점검완료'
            item.color4 = '#80FF00'
            break
          case 'P':
            item.code4 = '점검 진행중'
            item.color4 = '#FAE100'
            break
          case 'N':
            item.code4 = '점검 미완료'
            item.color4 = '#BE2E22'
            break
          }
          item.code6 = item.DEPT_NM
          item.code7 = item.FST_INSERT_DATE ? item.FST_INSERT_DATE  : 'X'
          item.ASGN_SNM !== null ? item.code6 = item.code6 + ' ' + item.ASGN_SNM : ''

          if(item.JOB_TYPE === 'plan')
            listB.value.push(item)
          else
            listA.value.push(item)
        }
      } else if(props.type === 'rules') {
        item.code1 = item.DEPT_NM
        item.code2 = item.VIO_SPLC_NM
        item.code3 = dayjs(item.VIO_TIME).format('YYYY.MM.DD HH:mm')

        if(props.dtype === 'absolute') {//props.dtype === 'idt' || 
          listA.value.push(item)
        } else if(props.dtype === 'important') {//props.dtype === 'clo' || 
          listB.value.push(item)
        } else if( props.dtype === 'general') {//props.dtype === 'gen' || 
          listC.value.push(item)
        } else if( props.dtype === 'crane') {//props.dtype === 'gen' || 
          listE.value.push(item)
        } else if( props.dtype === 'safecare') {//props.dtype === 'gen' || 
          listF.value.push(item)
        }
      }
    })

    // if(props.dtype === 'idt' || props.dtype === 'ptw' || props.dtype === 'absolute') {
    //   listA.value = list
    // } else if(props.dtype === 'clo' || props.dtype === 'plan' || props.dtype === 'general') {
    //   listB.value = list
    // } else if(props.dtype === 'gen' || props.dtype === 'daily' || props.dtype === 'general') {
    //   listC.value = list
    // } else if(props.dtype === 'ptw') {
    // } else if(props.dtype === 'plan') {
    // } else if(props.dtype === 'daily') {
    // } else if(props.dtype === 'absolute') {
    // } else if(props.dtype === 'important') {
    // } else if(props.dtype === 'general') {
    // }
  }
  // console.log('watch listA', listA.value)
  // console.log('watch listB', listB.value)
  // console.log('watch listC', listC.value)
})

watch(propsType, () => {
  // type 변동시 상세 페이지 닫힘
  detailPage.value = false
  console.log('props.type', props.type, props.dtype, detailPage.value)  
})

// ⭐ 이미지 경로
function getImgUrl(imgNm) {
  return new URL(`/src/assets/images/dashboard/${imgNm}`, import.meta.url).href
}

// 닫기 클릭
function clickClose() {
  if (detailPage.value) detailPage.value = false
  else emit('clickClose')
}

const fileImage = async fileParams => {
  console.log('fileImage', fileParams)
  let res = await commonSearchApi({ queryId: "searchFile", param: fileParams })
  res = res.ORESULT_CUR
  console.log('searchFile',res, res.length)
  if(res.length > 0) {
    fileParams.FILE_NO = res[0].FILE_NO
    fileParams.FILE_TITLE = res[0].FILE_TITLE
    fileParams.FILE_NAME_ORIGINAL = res[0].FILE_NAME_ORIGINAL
    fileParams.FILE_NAME = res[0].FILE_NAME
    fileParams.FILE_PATH = res[0].FILE_PATH
    fileParams.FILE_TYPE = res[0].FILE_TYPE
    fileParams.FILE_SIZE = res[0].FILE_SIZE
    fileParams.USER_ID = res[0].USER_ID
    console.log('fileParams', fileParams)
    let res2 = await commonDownloadFilesApi(fileParams).catch(e => {
      return null
    })

    return URL.createObjectURL(new Blob([res2]))
  }

  return null 
}

const fileImages = async fileParams => {
  console.log('fileImages', fileParams)
  let images = []
  let res = await commonSearchApi({ queryId: "searchFile", param: fileParams })
  res = res.ORESULT_CUR
  console.log('searchFile',res, res.length)
  if(res.length > 0) {
    for(let file of res) {
      fileParams.FILE_NO = file.FILE_NO
      fileParams.FILE_TITLE = file.FILE_TITLE
      fileParams.FILE_NAME_ORIGINAL = file.FILE_NAME_ORIGINAL
      fileParams.FILE_NAME = file.FILE_NAME
      fileParams.FILE_PATH = file.FILE_PATH
      fileParams.FILE_TYPE = file.FILE_TYPE
      fileParams.FILE_SIZE = file.FILE_SIZE
      fileParams.USER_ID = file.USER_ID
      console.log('fileParams', fileParams)
      let res2 = await commonDownloadFilesApi(fileParams).catch(e => {
        return null
      })
      images.push(URL.createObjectURL(new Blob([res2])))
    }
  }
  
  return images 
}

// 상세 패널 리스트 클릭
const clickDetailList = async (type, idx, item) => {

  if(type === 'inspect' && (item.JOB_TYPE === 'ptw' || item.JOB_TYPE === 'ptwe')){
    let param = item
    sAFCD0010Tab03Popup01.value.openPopup2(item)
    return
  }




  detailPage.value = true
  dataForm.value = []
  console.log('clickDetailList type', type)
  console.log('clickDetailList idx', idx)
  console.log('clickDetailList item', item)
  if (type === 'accident') {
    // 안전 사고에서 리스트 클릭
    let name = '', dept = '', title = '', subTitle = '', subTitle2 = ''
    // let prams = {
    //   CMPNY_DIV: item.CMPNY_DIV,
    //   SAGO_SN: item.SAGO_SN,
    //   PRSN_DIV: '1',
    // }
    // console.log('OPRAG0010_SAFAB0010_03', prams)
    // let res = await commonSearchApi({ queryId: "OPRAG0010_SAFAB0010_03", param: prams })
    // res = res.ORESULT_CUR
    // console.log('clickDetailList', res)
    // res.forEach((item, index) => {
    //   if(index === 0) {
    //     name = item.NAME
    //     dept = item.SOSOG_DEPT_DESC
    //   } else {
    //     name = name + ', ' + item.NAME
    //     dept = dept + ', ' + item.SOSOG_DEPT_DESC
    //   }
    //   console.log('res item', index, item)
    // })

    if(item.SAGO_TYPE_CD === 'SJE') {
      title = '산재'
    } else if(item.SAGO_TYPE_CD === 'GMS') {
      title = '휴업'
    } else if(item.SAGO_TYPE_CD === 'SNE') {
      title = '일반'
    }

    if(item.COME_SERIOUS_YN === 'Y') {
      subTitle = '중대성사고'
    } 
    
    if(item.JUNGDAE_YN === 'Y') {
      subTitle2 = '중대재해'
    }
    
    accidentForm.value = [
      { imgList: images },
      { label: '일시', text: item.code3 },
      { label: '장소', text: item.code2 },
      { label: '재해 조직', text: item.INJR_DEPT_NM },
      { label: '책임 조직', text: item.RESP_ORGN_NM },
      // { label: '재해자', text: name },
      { label: '사고 구분', textChip: title, subText: subTitle, subText2 : subTitle2,color1: 'dashDetailChip', color2: 'dashDetailChip2' },
      { label: '사고 유형', text: item.code1 },
      { label: '내용', textArea: item.SAGO_GAEYO },
    ]
    console.log('accidentForm', accidentForm.value)
    dataForm.value = accidentForm.value // 안전사고 데이터 셋 적용

    images.value = []
    
    fileParams.value.CMPNY_DIV = item.CMPNY_DIV
    for (let i = 1; i <= 3; i++) {
      let PIC_FILE_ID = `PIC_FILE_ID${i}`
      fileParams.value.FILE_ID = item[PIC_FILE_ID]
      console.log('prams FILE_ID', fileParams.value.FILE_ID)
      if(fileParams.value.FILE_ID)
        images.value.push(await fileImage(fileParams.value))
    }
    console.log('images',images.value)
  } else if (type === 'inspect') {
    
    let prams = {
      CMPNY_DIV: item.CMPNY_DIV,
    }

    if (idx === 0) {
      prams.WORK_ID = item.WORK_ID
      prams.RCV_NO = item.RCV_NO
      console.log('OPRAG0010_SAFCD0010_D01', prams)
      let res = await commonSearchApi({ queryId: 'OPRAG0010_SAFCD0010_D01', param: prams })
      res = res.ORESULT_CUR
      console.log('OPRAG0010_SAFCD0010_D01 res', res)
      // let grp0, grp1, grp2, grp3
      let grp0 = [], grp1 = [], grp2 = [], grp3 = [], jobType = ''
      res.forEach(gItem => {
        console.log('OPRAG0010_SAFCD0010_D01 gItem', gItem)
        if(gItem.CHECK_GROUP === 'B0' || gItem.CHECK_GROUP === 'B1')
          grp0.push(gItem)
        else if(gItem.CHECK_GROUP === 'C0' || gItem.CHECK_GROUP === 'C1')
          grp1.push(gItem)
        else if(gItem.CHECK_GROUP === 'A0')
          grp2.push(gItem)
        else if(gItem.CHECK_GROUP === 'E0')
          grp3.push(gItem)
      })
      //jobType = item.JOB_TYPE === 'ptw' ? '고위험점검' : '고위험점검(단기공사)'
      jobType = item.PTW_TYPE 
      console.log('OPRAG0010_SAFCD0010_D01 grp0', grp0)
      console.log('OPRAG0010_SAFCD0010_D01 grp1', grp1)
      console.log('OPRAG0010_SAFCD0010_D01 grp2', grp2)
      console.log('OPRAG0010_SAFCD0010_D01 grp3', grp3)
      inspectPTWForm.value = [
        { label: '작업명', text: item.WRK_DIST },
        { label: '작업상세', text: item.code1 },
        { label: '점검장소', text: item.AREA_NM + (item.AREA_DETAIL ? '-' + item.AREA_DETAIL : '') },
        { label: '허가 구분', chip: item.CF_DIV_NM, color: 'primary' },
        { label: '점검 유형/구분', textChip: jobType, subText: item.YARD_APP_YN === 'C' ? '부서자율점검' : '3중점검' ,color1: 'dashDetailChip', color2: 'dashDetailChip' },
        { label: '부서/협력사', text: item.code6 },
        { label: '점검 진행현황', text: item.code4 },
        {
          label: '점검 결과',
          vrtclList: {
            checkG0 : grp0,
            checkG1 : grp1,
            checkG2 : grp2,
            checkG3 : grp3,
          },
        },
      ]

      dataForm.value = inspectPTWForm.value // 안전점검 > 고위험점검 데이터 셋 적용
    } else if (idx === 1) {
      prams.WORK_ID = item.WORK_ID
      console.log('OPRAG0010_SAFCD0010_D02', prams)
      let res = await commonSearchApi({ queryId: 'OPRAG0010_SAFCD0010_D02', param: prams })
      res = res.ORESULT_CUR
      console.log('OPRAG0010_SAFCD0010_D02 res', res)

      let grp0 = [], grp1 = [], grp2 = [], grp3 = []
      
      res.forEach(gItem => {
        console.log('OPRAG0010_SAFCD0010_D02 gItem', gItem)
        if(gItem.CHECK_GROUP === 'B0' || gItem.CHECK_GROUP === 'B1')
          grp0.push(gItem)
        else if(gItem.CHECK_GROUP === 'C0' || gItem.CHECK_GROUP === 'C1')
          grp1.push(gItem)
        else if(gItem.CHECK_GROUP === 'A0')
          grp2.push(gItem)
        else if(gItem.CHECK_GROUP === 'E0')
          grp3.push(gItem)
      })
      
      inspectPlanForm.value = [
        { label: '작업명', text: item.code1 },
        { label: '점검장소', text: item.AREA_NM + (item.AREA_DETAIL ? '-' + item.AREA_DETAIL : '') },
        { label: '점검 유형/구분', textChip: '부서관리작업 점검', subText: '' ,color1: 'dashDetailChip', color2: 'dashDetailChip' },
        { label: '부서/협력사', text: item.code6 },
        { label: '점검 진행현황', text: item.code4 },
        {
          label: '점검 결과',
          vrtclList: {
            checkG0 : grp0,
            checkG1 : grp1,
            checkG2 : grp2,
            checkG3 : grp3,
          },
        },
      ]

      dataForm.value = inspectPlanForm.value // 안전점검 > 부서관리작업 데이터 셋 적용
    } else if (idx === 2) {
      let image1 = null, image2 = null
      fileParams.value.CMPNY_DIV = item.CMPNY_DIV
      fileParams.value.FILE_ID = item.JOCHI_PIC_BEFORE
      console.log('prams JOCHI_PIC_BEFORE', fileParams.value.FILE_ID)
      if(fileParams.value.FILE_ID)
        image1 = await fileImages(fileParams.value)

      fileParams.value.FILE_ID = item.JOCHI_PIC_AFTER
      console.log('prams JOCHI_PIC_AFTER', fileParams.value.FILE_ID)
      if(fileParams.value.FILE_ID)
        image2 = await fileImages(fileParams.value)

      inspectDailyForm.value = [
        { mLabel1: '점검 유형', mChip1: '일상점검', mColor1: 'primary',
          mLabel2: '점검 구분', mChip2: item.CHECK_GUBUN_NM, mColor2: 'primary',
          mLabel3: '조치 구분', mChip3: item.CHECK_JOCHI_NM, mColor3: 'primary',
        },
        { label: '점검 부서', text: item.DEPT_NM },
        { label: '점검자', text: item.EMP_NM },
        // { label: '점검 구분', text: item.CHECK_GUBUN_NM },
        { label: '점검 일시', text: dayjs(item.CHECK_DATE).format('YYYY.MM.DD HH:mm') },
        { label: '대상 부서', text: item.RECEIVER_DEPT_NM },
        { label: '점검 장소', text: item.AREA_NM },
        // { label: '조치 구분', text: item.CHECK_JOCHI_NM },
        { label: '잠재 사고 유형', text: item.SAGO_DIV_L_NM + '-' + item.SAGO_DIV_M_NM + '-' + item.SAGO_DIV_S_NM },
        { label: '잠검 대상물', text: item.CHECK_TARGET_OBJ1_NM + '-' + item.CHECK_TARGET_OBJ2_NM + '-' + item.CHECK_TARGET_OBJ3_NM },
        { imgList: image1 },
        { label: '점검 내용', textArea: item.CHECK_DESC ? item.CHECK_DESC : ' ' },
        { imgList: image2 },
        { label: '조치 내용', textArea: item.JOCHI_DESC ? item.JOCHI_DESC : ' ' },
      ]
      dataForm.value = inspectDailyForm.value // 안전점검 > 일상점검 데이터 셋 적용
    }
  } else if (type === 'rules') {
    let image1 = [], image2 = []
    fileParams.value.CMPNY_DIV = item.CMPNY_DIV
    fileParams.value.FILE_ID = item.FILE_ID1
    console.log('prams FILE_ID1', fileParams.value.FILE_ID)
    if(fileParams.value.FILE_ID)
      image1 = await fileImages(fileParams.value)
    console.log('image1', image1)
    fileParams.value.FILE_ID = item.FILE_ID2
    console.log('prams FILE_ID2', fileParams.value.FILE_ID)
    if(fileParams.value.FILE_ID)
      image2 = await fileImages(fileParams.value)

    rulesForm.value = [
      // { label: '위반사항', text: ' ' },
      { imgList: image1 },
      // { image1: image1 ? image1 : ' ' },
      // { label: '조치사항', text: ' ' },
      // { image2: image2 ? image2 : ' ' },
      { label: '일시', text: item.code3 },
      { label: '장소', text: item.code2 },
      { label: '위반조직', text: item.DEPT_NM },
      { label: '위반구분', chip: item.VIO_GDIV_NM, color: 'primary' },
      { label: '위반 내용', text: item.VIO_MDIV_NM },
      { label: '내용', textArea: item.VIO_DESC },
      // { label: '위반자', text: item.DEPT_NM + ' ' + item.VIOLATOR },
      { label: '단속자 조직/성명', text: item.DANSOK_ASGN_NM + ' / ' + item.DANSOK_EMP_NM },
      
    ]
    dataForm.value = rulesForm.value // 안전수칙 데이터 셋 적용
  }
}
</script>

<template>
  <v-sheet
    v-if="props.visible"
    color="dashDetailPannel"
    width="23%"
    height="100%"
    class="detailPannel pa-8"
    :key="props.type"
    >
    <section class="d-flex justify-space-between mb-4">
      <p class="cardTitle">
        {{
          props.type === 'accident'
            ? '안전사고 상세'
            : props.type === 'inspect'
              ? '안전점검 상세'
              : props.type === 'rules'
                ? '안전수칙 상세'
                : ''
        }}
        <!-- porps.dtype === 'ptw' 
                ? '고위험점검 상세' : porps.dtype === 'plan'
                  ? '부서관리 작업 상세' : '일상점검 상세' -->
      </p>
      <svg-icon :name="!detailPage ? 'close' : 'prev2'" class="closeBtn" @click="clickClose" />
    </section>
    <!-- 리스트 -->
    <section v-if="!detailPage" style="height: calc(100% - 45px)" flat class="overflow-y-auto">
      
      <article v-if="(props.dtype === '' && props.type === 'rules') || (props.dtype === 'safecare')" 
        :style="props.dtype=== '' ? 'height: 33%' : 'height: 100%'" class="pt-6">
        <div class="d-flex justify-space-between pb-2">
          {{
            props.type === 'rules' ? 'The Safe Care 핵심안전수칙' : ''
          }}
          <div>
            <span class="dataNum">{{ listF.length }}</span> 건
          </div>
        </div>
        <v-card color="dashDetailCard" flat class="overflow-y-auto" height="calc(100% - 34px)">
          <template v-for="(item, i) in listF" :key="i">
            <v-list-item @click="clickDetailList(props.type, 1, item)" class="pa-5">
              <div class="d-flex justify-space-between align-center formSubData">
                <div>
                  <p>{{ item.code1 }}</p>
                  <p v-if="item.code6">{{ item.code6 }}</p>
                  <span>{{ item.code2 }}</span> <v-divider vertical />
                  <span>{{ item.code3 }}</span>
                  <span class="d-flex gap-2">
                    <v-chip v-if="item.code4" :color="item.color4" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code4 }}</span>
                    </v-chip>
                    <v-chip v-if="item.code5" :color="item.color5" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code5 }}</span>
                    </v-chip>
                  </span>
                </div>
                <div style="width: 20px;">
                  <svg-icon name="arrowRight" />
                </div>
              </div>
            </v-list-item>
            <v-divider v-if="i < listF.length" class="mx-5" />
          </template>
        </v-card>
      </article>

      <article v-if="props.dtype === '' || (props.dtype === 'idt' || props.dtype === 'ptw' || props.dtype === 'absolute')"
        :style="props.dtype=== '' ? 'height: 33%' : 'height: 100%'" class="pt-6">
        <div class="d-flex justify-space-between pb-2">
          {{
            props.type === 'accident'
              ? '산재사고'
              : props.type === 'inspect'
                ? '고위험점검'
                : props.type === 'rules'
                  ? '절대수칙'
                  : ''
          }}
          <div>
            <span class="dataNum">{{ listA.length }}</span> 건
          </div>
        </div>
        <v-card color="dashDetailCard" flat class="overflow-y-auto" height="calc(100% - 34px)">
          <template v-for="(item, i) in listA" :key="i">
            <v-list-item @click="clickDetailList(props.type, 0, item)" class="pa-5">
              <div class="d-flex justify-space-between align-center formSubData">
                <div>
                  <p v-if="item.code1">{{ item.code1 }}</p>
                  <p v-if="item.code6">{{ item.code6 }}</p>
                  <p> 최초점검시각: {{ item.code7  }}</p>
                  <span>{{ item.code2 }}</span> <v-divider vertical />
                  <span>{{ item.code3 }}</span>
                  <span class="d-flex gap-2">
                    <v-chip v-if="item.code4" :color="item.color4" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code4 }}</span>
                    </v-chip>
                    <v-chip v-if="item.code5" :color="item.color5" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code5 }}</span>
                    </v-chip>
                  </span>
                </div>
                <div style="width: 20px;">
                  <svg-icon name="arrowRight" />
                </div>
              </div>
            </v-list-item>
            <v-divider v-if="i < listA.length" class="mx-5" />
          </template>
        </v-card>
      </article>
      <article v-if="props.dtype === '' || (props.dtype === 'clo' || props.dtype === 'plan' || props.dtype === 'important')"
        :style="props.dtype=== '' ? 'height: 33%' : 'height: 100%'" class="pt-6">
        <div class="d-flex justify-space-between pb-2">
          {{
            props.type === 'accident'
              ? '휴업사고'
              : props.type === 'inspect'
                ? '부서관리작업'
                : props.type === 'rules'
                  ? '중대성수칙'
                  : ''
          }}
          <div>
            <span class="dataNum">{{ listB.length }}</span> 건
          </div>
        </div>
        <v-card color="dashDetailCard" flat class="overflow-y-auto" height="calc(100% - 34px)">
          <template v-for="(item, i) in listB" :key="i">
            <v-list-item @click="clickDetailList(props.type, 1, item)" class="pa-5">
              <div class="d-flex justify-space-between align-center formSubData">
                <div>
                  <p>{{ item.code1 }}</p>
                  <p v-if="item.code6">{{ item.code6 }}</p>
                  <span>{{ item.code2 }}</span> <v-divider vertical />
                  <span>{{ item.code3 }}</span>
                  <span class="d-flex gap-2">
                    <v-chip v-if="item.code4" :color="item.color4" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code4 }}</span>
                    </v-chip>
                    <v-chip v-if="item.code5" :color="item.color5" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code5 }}</span>
                    </v-chip>
                  </span>
                </div>
                <div style="width: 20px;">
                  <svg-icon name="arrowRight" />
                </div>
              </div>
            </v-list-item>
            <v-divider v-if="i < listB.length" class="mx-5" />
          </template>
        </v-card>
      </article>
      <article  v-if="(props.dtype === '' && props.type === 'rules') || (props.dtype === 'crane')" 
        :style="props.dtype=== '' ? 'height: 33%' : 'height: 100%'" class="pt-6">
        <div class="d-flex justify-space-between pb-2">
          {{
            props.type === 'rules'
              ? '크레인 특별안전수칙' : ''
          }}
          <div>
            <span class="dataNum">{{ listE.length }}</span> 건
          </div>
        </div>
        <v-card color="dashDetailCard" flat class="overflow-y-auto" height="calc(100% - 34px)">
          <template v-for="(item, i) in listE" :key="i">
            <v-list-item @click="clickDetailList(props.type, 2, item)" class="pa-5">
              <div class="d-flex justify-space-between align-center formSubData">
                <div>
                  <p>{{ item.code1 }}</p>
                  <p v-if="item.code6">{{ item.code6 }}</p>
                  <span>{{ item.code2 }}</span> <v-divider vertical />
                  <span>{{ item.code3 }}</span>
                  <span class="d-flex gap-2">
                    <v-chip v-if="item.code4" :color="item.color4" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code4 }}</span>
                    </v-chip>
                    <v-chip v-if="item.code5" :color="item.color5" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code5 }}</span>
                    </v-chip>
                  </span>
                </div>
                <div style="width: 20px;">
                  <svg-icon name="arrowRight" />
                </div>
              </div>
            </v-list-item>
            <v-divider v-if="i < listC.length" class="mx-5" />
          </template>
        </v-card>
      </article>
      <article v-if="props.dtype === '' || (props.dtype === 'gen' || props.dtype === 'daily' || props.dtype === 'general')" 
        :style="props.dtype=== '' ? 'height: 33%' : 'height: 100%'" class="pt-6">
        <div class="d-flex justify-space-between pb-2">
          {{
            props.type === 'accident'
              ? '일반사고'
              : props.type === 'inspect'
                ? '일상점검'
                : props.type === 'rules'
                  ? '일반수칙'
                  : ''
          }}
          <div>
            <span class="dataNum">{{ listC.length }}</span> 건
          </div>
        </div>
        <v-card color="dashDetailCard" flat class="overflow-y-auto" height="calc(100% - 34px)">
          <template v-for="(item, i) in listC" :key="i">
            <v-list-item @click="clickDetailList(props.type, 2, item)" class="pa-5">
              <div class="d-flex justify-space-between align-center formSubData">
                <div>
                  <p>{{ item.code1 }}</p>
                  <p v-if="item.code6">{{ item.code6 }}</p>
                  <span>{{ item.code2 }}</span> <v-divider vertical />
                  <span>{{ item.code3 }}</span>
                  <span class="d-flex gap-2">
                    <v-chip v-if="item.code4" :color="item.color4" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code4 }}</span>
                    </v-chip>
                    <v-chip v-if="item.code5" :color="item.color5" variant="flat" label class="formChip">
                      <span style="color: black;">{{ item.code5 }}</span>
                    </v-chip>
                  </span>
                </div>
                <div style="width: 20px;">
                  <svg-icon name="arrowRight" />
                </div>
              </div>
            </v-list-item>
            <v-divider v-if="i < listC.length" class="mx-5" />
          </template>
        </v-card>
      </article>
      
    </section>
    <!-- 상세페이지 -->
    <section v-else :key="detailPage" style="height: calc(100% - 43px)" class="overflow-y-auto">
      <div v-for="item in dataForm" :key="item" class="formItem">
        <div v-if="item.label" class="formLabel">{{ item.label }}</div>
        <v-carousel
          v-if="item.imgList"
          height="23vh"
          width="100%"
          class="detailImgSlide"
          delimiter-icon="mdi-circle-medium"
          v-model="slide"
          hide-delimiter-background>
          <v-carousel-item
            v-for="(img, idx) in item.imgList"
            :key="idx"
            :src="img"
            width="100%"
            contain></v-carousel-item>
        </v-carousel>
        <img
          v-if="item.image1"
          height="100%"
          width="100%"
          :src="item.image1"
        />
        <img
          v-if="item.image2"
          height="100%"
          width="100%"
          :src="item.image2"
        />
        <div v-if="item.vrtclList" class="vrtclList">
          <v-carousel
            v-for="(lists, i) in item.vrtclList"
            :key="i"
            height="auto"
            width="100%"
            class="detailDataSlide"
            delimiter-icon="mdi-circle-medium"
            hide-delimiters
            :v-model="`${i}`"
            hide-delimiter-background
            show-arrows="hover">
            <v-carousel-item
              v-for="(list, idx) in lists"
              :key="idx"
              width="100%"
              contain>
              <v-sheet
                color="dashDetailTextCard"
                class="d-flex justify-space-between pa-5">
                <div>
                  <p class="textLabel pb-1">{{ list.CHECK_GROUP_NM }}</p>
                  <p class="textLabel">{{ list.ASGN_FULL_NM }}</p>
                  <p class="textData">
                    {{ list.CHECK_EMP_NM }} <v-divider vertical style="height: 1em" class="mx-1" />
                    {{ list.CHECK_DATE }}
                  </p>
                </div>
                <div
                  class="textLabel"
                  :style="
                    list.CHECK_RESULT_NM === '양호'
                      ? 'color:#5470AF;'
                      : list.CHECK_RESULT_NM === '미흡'
                        ? 'color:#FF0000;'
                        : ''
                  ">
                  {{ list.CHECK_RESULT_NM }}
                </div>
              </v-sheet>
            </v-carousel-item>
          </v-carousel>
          <!-- <v-sheet
            v-for="list in item.hrztlList"
            :key="list"
            color="dashDetailTextCard"
            class="d-flex flex-column align-center pa-5">
            <p class="textLabel">{{ list.label }}</p>
            <p
              class="textData"
              :class="
                list.label === '양호'
                  ? 'text-dashSuccess'
                  : list.label === '미흡'
                    ? 'text-dashError'
                    : ''
              ">
              {{ list.data }}
            </p>
          </v-sheet> -->
        </div>
        <!-- <div v-if="item.vrtclList" class="vrtclList">
          <v-sheet
            v-for="list in item.vrtclList"
            :key="list"
            color="dashDetailTextCard"
            class="d-flex justify-space-between pa-5">
            <div>
              <p class="textLabel">{{ list.CHECK_GROUP_NM }}</p>
              <p class="textData">
                {{ list.CHECK_EMP_NM }} <v-divider vertical style="height: 1em" class="mx-1" />
                {{ list.CHECK_DATE }}
              </p>
            </div>
            <div
              class="textLabel"
              :class="
                list.CHECK_RESULT_NM === '양호'
                  ? 'text-dashSuccess'
                  : list.CHECK_RESULT_NM === '미흡'
                    ? 'text-dashError'
                    : ''
              ">
              {{ list.CHECK_RESULT_NM }}
            </div>
          </v-sheet>
        </div> -->
        <div v-if="item.textChip" class="formData d-flex gap-2">
            <v-chip :color="item.color1" variant="flat" label class="formChip">
              {{ item.textChip }}
            </v-chip>
            <v-chip v-if="item.subText" :color="item.color2" variant="flat" label class="formChip">
              {{ item.subText }}
            </v-chip>
             <v-chip v-if="item.subText2" :color="item.color2" variant="flat" label class="formChip">
              {{ item.subText2 }}
            </v-chip>
        </div>
        <div v-if="item.text" class="formData">
          {{ item.text }}
          <span v-if="item.subText" class="formSubData">{{ `(${item.subText})` }}</span>
        </div>
        <v-chip v-if="item.chip" :color="item.color" variant="flat" label class="formChip">
          {{ item.chip }}
        </v-chip>
        <v-textarea
          v-if="item.textArea"
          :model-value="item.textArea"
          bg-color="dashDetailTextCard"
          variant="plain"
          class="formTextArea"
          disabled
          no-resize
        />
        <div v-if="item.mLabel1" class="d-flex gap-2">
          <div>
            <div class="formLabel pb-2">{{ item.mLabel1 }}</div>
            <v-chip v-if="item.mChip1" :color="item.mColor1" variant="flat" label class="formChip">
              {{ item.mChip1 }}
            </v-chip>
            <div v-if="item.mText1" class="formData">
              {{ item.mText1 }}
            </div>
          </div>
          <div>
            <div class="formLabel pb-2">{{ item.mLabel2 }}</div>
            <v-chip v-if="item.mChip2" :color="item.mColor2" variant="flat" label class="formChip">
              {{ item.mChip2 }}
            </v-chip>
            <div v-if="item.mText2" class="formData">
              {{ item.mText2 }}
            </div>
          </div>
          <div>
            <div class="formLabel pb-2">{{ item.mLabel3 }}</div>
            <v-chip v-if="item.mChip3" :color="item.mColor3" variant="flat" label class="formChip">
              {{ item.mChip3 }}
            </v-chip>
            <div v-if="item.mText3" class="formData">
              {{ item.mText3 }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </v-sheet>

  <SAFCD0010Tab03Popup01
    ref="sAFCD0010Tab03Popup01"
  />
</template>

<style lang="scss">
// 상세 패널
.detailPannel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;

  .closeBtn {
    cursor: pointer;
  }

  .formItem {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  // 가로 카드 리스트
  .hrztlList {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    .textLabel {
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 18px);
      font-weight: 700;
      line-height: normal;
    }
    .textData {
      padding-top: 24px;
      font-size: 32px;
      font-size: clamp(28px, 1.5vw, 40px);
      font-weight: 700;
      line-height: normal;
    }
  }
  // 세로 카드 리스트
  .vrtclList {
    display: flex;
    flex-direction: column;
    gap: 12px;
    .textLabel {
      font-size: 16px;
      font-size: clamp(14px, 0.8vw, 20px);
      font-weight: 700;
      line-height: normal;
    }
    .textData {
      padding-top: 8px;
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 18px);
      font-weight: 300;
      line-height: normal;
    }
  }

  // 이미지 슬라이드
  .detailImgSlide {
    // 좌우 버튼
    .v-window__controls {
      padding: 0;
      .v-window__left,
      .v-window__right {
        background: transparent;
        box-shadow: none;
        padding: 0px !important;
        .v-icon {
          width: 40px;
          height: 40px;
        }
      }
      .mdi-chevron-left::before,
      .mdi-chevron-right::before {
        content: '';
        width: 40px;
        height: 40px;
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Frame 853'%3E%3Cpath id='Vector 5' d='M25 30L15 20L25 10' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
      .mdi-chevron-right::before {
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Frame 852'%3E%3Cpath id='Vector 5' d='M15 10L25 20L15 30' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
    }
    // 페이지 버튼
    .v-carousel__controls {
      .v-btn {
        width: 24px;
        height: 24px;
        opacity: 0.25;
      }
      .v-btn--active {
        opacity: 1;
      }
    }
    .v-btn__overlay {
      opacity: 0;
    }
  }
  // DATA 슬라이드
  .detailDataSlide {
    // 좌우 버튼
    .v-window__controls {
      padding: 0;
      .v-window__left,
      .v-window__right {
        background: transparent;
        box-shadow: none;
        padding: 0px !important;
        .v-icon {
          width: 40px;
          height: 40px;
        }
      }
      .mdi-chevron-left::before,
      .mdi-chevron-right::before {
        content: '';
        width: 40px;
        height: 40px;
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Frame 853'%3E%3Cpath id='Vector 5' d='M25 30L15 20L25 10' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
      .mdi-chevron-right::before {
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Frame 852'%3E%3Cpath id='Vector 5' d='M15 10L25 20L15 30' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
    }
    // 페이지 버튼
    .v-carousel__controls {
      .v-btn {
        width: 24px;
        height: 24px;
        opacity: 0.25;
      }
      .v-btn--active {
        opacity: 1;
      }
    }
    .v-btn__overlay {
      opacity: 0;
    }
  }

  // 텍스트 스타일
  .formLabel {
    color: #99a0b0;
    font-size: 14px !important;
    font-size: clamp(14px, 0.7vw, 18px);
    font-weight: 400;
    line-height: normal;
  }
  .formData {
    font-size: 16px !important;
    font-size: clamp(14px, 0.8vw, 20px);
    font-weight: 700;
    line-height: normal;
  }
  .formSubData {
    color: rgba(255, 255, 255, 0.75);
    font-size: 16px !important;
    font-size: clamp(14px, 0.8vw, 20px);
    font-weight: 400;
    line-height: normal;
  }
  .formChip {
    width: fit-content;
    margin: 0 !important;
  }
  .formTextArea {
    .v-field__input {
      color: #fff !important;
      font-size: 16px;
      font-size: clamp(14px, 0.8vw, 20px);
      font-weight: 500;
      line-height: normal;
      padding: 12px 16px;
    }
  }
}
</style>
