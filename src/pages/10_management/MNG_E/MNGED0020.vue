<!-- MNGED0020 법규 준수평가 전체현황 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'

defineOptions({
  name:'10_management-MNG_E-MNGED0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore();
const grdMain = ref(null)
const deptPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  TM_GUBN: 'UP',
  CYCLE : '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD : userStore.deptCd,
  DEPT_NM : userStore.deptNm,
  INJR_DEPT_CD: userStore.deptCd,  
  ASGN_NM: ` ${userStore.bsnsNm} - ${userStore.deptNm}`,
  EVA_RESULT : '',
})

//코드리스트 세팅 
const codeList = reactive({
  CYCLE: [],
  TM_GUBN : [
    {COD : 'UP', TXT : '상반기'},
    {COD : 'UN', TXT : '하반기'},
  ],
  EVA_RESULT : [
    {COD : '' , TXT : '전체'},
    {COD : 'A', TXT : '적합'},
    {COD : 'S', TXT : '보완'},
    {COD : 'N', TXT : '미해당'},
  ],
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible:false } }, 
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', width:'50', header: { text: t('연도') }, visible : false },
    { fieldName: 'TM_GUBN', dataType: 'text', width:'50', header: { text: t('구분') }, visible : false},
    { fieldName: 'LAW_CD', dataType: 'text', header: { text: t('관련법 코드') }, visible : false },
    { fieldName: 'LAW_NM', dataType: 'text', width:'50', header: { text: t('관련법명') }, editable: false  },
    { fieldName: 'EVA_DEPT_CD', dataType: 'text', width:'50', header: { text: t('평가주체부서 코드') }, visible : false },
    { fieldName: 'EVA_DEPT_NM', dataType: 'text', width:'50', header: { text: t('평가주체부서') }, editable: false  },
    { fieldName: 'CONTENT', dataType: 'text', header: { text: t('준수사항') }, editable: false  },
    { fieldName: 'CYCLE', dataType: 'text', width:'50', header: { text: t('주기') }, editable: false, lookupDisplay: true, },
    { fieldName: 'CHK_TARGET', dataType: 'text' , width:'50', header: { text: t('확인대상') }, editable: false, },
    { fieldName: 'CHK_CONTENT', dataType: 'text', width:'50', header: { text: t('확인내용') }, editable: false,  },
    { fieldName: 'DEPT_CD', dataType: 'text', width:'50', header: { text: t('담당부서 코드') }, visible : false, },
    { fieldName: 'DEPT_NM', dataType: 'text', width:'50', header: { text: t('담당부서명') }, visible : false,   },
    { fieldName: 'MANAGER_ID', dataType: 'text', width:'50', header: { text: t('담당자 ID') }, visible : false,   },
    { fieldName: 'MANAGER_NM', dataType: 'text', width:'50', header: { text: t('담당자명') }, visible : false, button : 'action',  },
    { fieldName: 'EVA_RESULT', dataType: 'text', width:'50', header: { text: t('평가결과') }, editable: false, lookupDisplay: true  },
    { fieldName: 'SOL_CONTENT', dataType: 'text', width:'100', header: { text: t('조치사항') }, editable: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'IDX_KEY', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields

//콤보박스 및 그리드 데이터 바인딩
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIAF40'),
  ]).then(res => {
    codeList.CYCLE = [{COD : '' , TXT : '전체'}]
    res[0].ORESULT_CUR.forEach(item => {
      codeList.CYCLE.push({COD : item.COD, TXT : item.TXT })
    })
    grdMain.value.setBindingColumn("CYCLE", res[0].ORESULT_CUR, "COD", "TXT") 
    grdMain.value.setBindingColumn("EVA_RESULT", codeList.EVA_RESULT, "COD", "TXT") 
  })
}
//팝업 이벤트
const openPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
    BSNS_CD: searchParams.BSNS_CD,
  })
}
//부서 팝업 선택결과
const onDeptSelected = (row) => {
  searchParams.DEPT_CD = row.ASGN_CD
  searchParams.DEPT_NM = row.ASGN_SHRT_NM
  searchParams.INJR_DEPT_CD = row.ASGN_CD
  searchParams.ASGN_NM = row.ASGN_FULL_NM
}

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {       //조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeMainSearch)
      .setQuery(searchMainData)
      .setAfter(afterMainSearch)
      .run()
  } 
  else if(btn.id === 'btnPrint'){    //출력
    print()
  }
}

const beforeMainSearch = () => {
  return true
}
//조회
const searchMainData = () => {
  let searchParam = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    YEAR : searchParams.YEAR,
    TM_GUBN : searchParams.TM_GUBN,
    CYCLE : searchParams.CYCLE,
    DEPT_CD : searchParams.DEPT_CD,
    EVA_RESULT : searchParams.EVA_RESULT,
  }

  return commonSearchApi({ queryId : 'MNGED0020_SEARCH_01', param: searchParam })
}
//조회 후
const afterMainSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//출력
const print = () =>{
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '법규 준수평가 전체현황_'+searchParams.YEAR+ '_'+ (searchParams.TM_GUBN === 'UP' ? '상반기_' : '하반기_') + searchParams.DEPT_NM + '.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: searchParams.YEAR+ ' '+ (searchParams.TM_GUBN === 'UP' ? '상반기 ' : '하반기 ') + searchParams.DEPT_NM +' 법규 준수평가 등록',
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: 'excelTitle',
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

onMounted(() => {
  vm.$nextTick(() => {
    initCodeList() 
  
    onButtonsClick({ id:'btnSearch' })
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height"> 
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">           
          <i-select
            width="180px"
            :label="$t('년도')"
            v-model="searchParams.YEAR"
            label-width="30px"
            type="YEAR"
            margin="10px"
            required
          />
          <i-select
            :label="$t('구분')"
            width="200px"
            v-model="searchParams.TM_GUBN"
            :items="codeList.TM_GUBN"
            item-title="TXT"
            item-value="COD"
            required
          />
          <!-- <i-select
            :label="$t('주기')"
            width="200px"
            v-model="searchParams.CYCLE"
            :items="codeList.CYCLE"
            item-title="TXT"
            item-value="COD"
          /> -->
          <i-select
            :label="$t('평가결과')"
            width="200px"
            v-model="searchParams.EVA_RESULT"
            :items="codeList.EVA_RESULT"
            item-title="TXT"
            item-value="COD"
          />
          <i-input
            :label="$t('부서')"
            v-model="searchParams.DEPT_NM"
            width="300px"
            margin="4px"
            readonly
            required
            append-inner-icon="mdi-magnify"
            @keydown.enter="
              (e) => {
                openPopup();
              }
            "
            @update:modelValue="
              (e) => {
                searchParams.DEPT_CD = null;
              }
            "
            @click:appendInner="openPopup()"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.INJR_DEPT_CD"
            width="80px"
            readonly
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="90%" class="mb-2">
          <IGridTitle :title="$t('법규 준수 평가 체크리스트 목록')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>    
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>

  
