<!-- SPPHE0010Popup_02 실시간 태풍 모니터링 문자전송 예시내역 팝업-->
<!-- SI2팀 마환구 2025-02-14 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, defineProps, defineEmits } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'

import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, commonSendSMS } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'

import ILabel from '@/components/ILabel.vue'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)


const emit = defineEmits(['seldata'])

const codeList = reactive({
  Content_Result: [],
  Send_MSG :[]
})


//mouse coordinate
const x = ref(0)
const y = ref(0)



// ------------------------------------------------------------------------
// * 작성자 : 류원진
// * 작성일 : 2024-03-21
// * 내용   : 화면 오픈시 받아온 데이터로만 SMS 전송을 해야하는 상황에 사용하기 위해 작성함(추가, 삭제 제한)
const visible = reactive({
  gridBtn: true,  //그리드 버튼
})

// ------------------------------------------------------------------------
// 조회 파라미터
let searchParams1 = reactive({})
let searchParams2 = reactive({})

const detailData = reactive({
  USER_ID: '',
  CMPNY_DIV: '',
  EMPNO_TO: '',
  SYSCODE: '156',
  FROM_P_NO: '',
  TO_P_NO: '',
  TITLE: '',
  TYPE: '',
  ROWS: '',
})

const sendSMSParams = reactive({
  EMPNO_FROM: '', //보내는 사람 사번
  EMPNO_TO: '',   //받는 사람 사번 
  SYSCODE: '',    //시스템코드
  FROM_P_NO: '',  //보내는 사람 전화번호
  TO_P_NO: '',    //받는 사람전화번호
  TITLE: '',      //메시지 내용
})

// const codeList = reactive({
//   DEPT: []
// })


const openPopup = async () => {

  dialog.value = true
  onDialog();
}

onMounted(() => {
  // let param = {
    
  // }
  //   // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
  //   commonSearchApi({ queryId: 'SPPHE0010_SEARCH_07', param: param })
  //   .then(res => {
  //     codeList.Content_Result = res.ORESULT_CUR  
  //   })
  //   console.log("gridRows :",gridRows.value);
})

const gridRows = computed(()=>{
  const rows=[];
  // console.log("len:",codeList.Content_Result.length);
  for(let i=0; i<codeList.Content_Result.length;i+=4)
  {
    rows.push(codeList.Content_Result.slice(i,i+4));
  }
  return rows
})

const onDialog =()=>{
  let param = {
    
  }
    // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
    commonSearchApi({ queryId: 'SPPHE0010_SEARCH_07', param: param })
    .then(res => {
      codeList.Content_Result = res.ORESULT_CUR  
      codeList.Send_MSG=res.ORESULT_CUR.map(item=>({
        CONTENTS : item.CONTENTS
      }))

      // console.log(codeList.Send_MSG);
      
    })
    
    
}


const onClose = () => {
  detailData.TYPE = ''
  detailData.ROWS = ''
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnContent') {
    //내용이 있는 POPUP 띄우기
  }
  else if (btn.id === 'btnSend') {
    // console.log('btnSend')
    new saveFlowHelper(vm, t)
      .setConfirmMessage('메세지를 전송 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(sendSMS)
      .setResultMessage('전송 완료했습니다.')
      .run()
  }

  else if (btn.id === 'btnClose') {
    onClose()
  }
}
const getButtonColor=(DIVCODE)=>
{
  switch (DIVCODE) {
    case '1':
      return 'bg-yellow my-0';
    case '2':
      return 'bg-orange my-0';
    case '3':
      return 'bg-red my-0';
    default:
      return 'bg-green my-0';
  }
};

const handleButtonClick =(index)=>{
  // console.log("data :",codeList.Send_MSG[index].CONTENTS);
  emit('seldata',codeList.Send_MSG[index].CONTENTS);
  onClose()
}

const LableTitle = ref(['1. 태풍 발생 시 문자 발송 예시', '2. 지진 발생 시 문자 발송 예시',
                        '3. 지진(쓰나미) 발생 시 문자 발송 예시','4. 화재·폭발 발생 시 문자 발송 예시'])

</script>

<template style="margin: 0px">
  <v-dialog v-model="dialog" eager persistent width="1200" class="p-absolute user-select-none"
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>★비상 상황시 문자 발송 시스템</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <!-- <IGridTitle :title="$t('원하시는 메시지를 선택하세요')" /> -->
        <IGridTitle :title="$t('원하시는 메시지를 선택하세요')" :use-permission="false" :button-list="['btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div v-for="(row, rowIndex) in gridRows" :key="rowIndex">
          <v-row>
            <v-col>
              <ILabel :label="$t(LableTitle[rowIndex])">
              </ILabel>
            </v-col>
          </v-row>          
          <v-row>
          <v-col v-for="(item, colIndex) in row" :key="colIndex" cols="3">
            <v-card class="pa-4 text-center">
                <VTextarea v-model="item.CONTENTS" readonly style="height:90px"></VTextarea>
                <v-btn :class="getButtonColor(item.DIVCODE)" block @click="handleButtonClick(rowIndex * 4 + colIndex)" style="margin:0%">
                  <div>{{ item.BUTTON1 }}<br>
                  {{ item.BUTTON2 }}</div>
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>