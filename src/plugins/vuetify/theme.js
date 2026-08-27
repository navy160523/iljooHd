/**
 * ============================================================================================================================================================
 * 👉 테마 적용
 * -> 테마의 타입과 컬러를 정의한다.
 * ============================================================================================================================================================
 */
import colors from 'vuetify/lib/util/colors'

const theme = {
  defaultTheme: "light",
  themes: {
    light: {
      dark: false,
      colors: {
        // 🎨 Main & Sub Color
        primary: "#1A40C7", // 메인 컬러
        primarySub: "#062F87", // 메인 서브 컬러
        secondary: "#0C2458", // 메인 네이비
        success: "#0BB69C", // 성공
        info: "#0581FD", // 알림
        warning: "#FF7637", // 경고    
        error: "#FF5252", // 에러
        base: "#F4F5F9", //기본 BG ex) grid header
        disabled: "#707690",
        white: "#FFFFFF",
        transparent: "rgba(255,255,255,0)",

        helpCircle: colors.lightBlue.darken1,

        mainBg: '#F7F8FB',
        popupBg: '#f3f3f3',
        popupBorder: '#E6E6E6',
        footerBg: '#313237',
        
        // 🎨chart
        chart1: '#1A40C7',
        chart2: '#0075FF',
        chart3: '#9458F7',
        chart4: '#12C97C',
        chart10: '#1A40C715',
        chart20: '#0075FF15',
        chart30: '#9458F715',
        chart40: '#12C97C15',

        // 🎨 Input
        inputCheck: "#1A40C7",
        inputRadio: "#1D43CA",
        inputDisabled: "#E4E4E4",
        popupDivider: "rgba(26, 64, 199, 0.05)",

        // 🎨 Button
        btnPrimary: "#1D43CA", // 조회조건 light btn
        btnPrimaryHover: "#1232a6",
        btnSecondary: "#062F87", // 조회조건 dark btn & 그리드 내부 btn
        btnSecondaryHover: "#0b2662",
        btnContnet: '#1457D8', //컨텐츠 내부 btn
        btnTertiary: "#0C2458", // popUp 닫기 btn
        btnCancel: "#CCCCCC", // popUp 취소 btn
        btnDisabled: "#F1F2F6", // 버튼 비활성화
        // btnDisabled: "#C3C7D4", // 버튼 비활성화
        chipActive: '#C8D1EF', // chip active bg
        chipBase: '#E4E5E9', // chip default bg

        // 🎨 Text
        textMain: "#222222",
        textIndex: '#85D3FF',
        textContents: '#0072FF',
        textInfo: "#051537",
        textInfoSub: "rgba(34, 34, 34, 0.3)",
        textCaption: "#666666",
        textEmphasis: "#FF0000",
        textSub: "#1D43CA",
        textDivider: "#8A8A8A",
        textLabel: "#999999",
        textDisabled: "#8D93A6",
        textCard: "#A2A8B5",
        textGrey: '#B9B9B9',
        textGrey2: '#999999',

        // 🎨 dashboard
        dashHeader: '#061537',
        dashDark: '#061537',
        dashCard: '#1E2E55',
        dashLogBox: '#162449',
        dashActive: '#112045',
        dashSliderBg: '#08183E',
        dashBtnDisabled: '#2C3D65',
        dashSelectBox: '#616A82',
        dashDetailPannel: '#344262',
        dashDetailCard: '#263454',
        dashDetailChip: '#5470AF',
        dashDetailChip2: '#FF0000',
        dashDetailTextCard: '#2C3957',
        dashText: '#FFFFFF',
        dashAcc: '#E1580A',
        dashIns: '#1A40C7',//'#11A74D',
        dashRul: '#11A74D',//'#6683EF',
        dashSuccess: '#1255FF',
        dashError: '#E51C1C',
        
        // 🎨 RealGrid
        focusRow: "#fafafa",
        checkedRow: "#e9edf9",
        cellHover: "#ededed",
        checkedCellHover: "#d9e0f3",
        gridBorder: "#DFE3EF",
        headerCell: "#f4f5f9",
        headerFocus: "#dfe3ef",
        headerHover: "#d6dae7",
        cellDisable: "#c3c7d4",
      },
    },
  },
  dark: {
    dark: true,
    colors: {
      // 🎨 Main & Sub Color
      primary: "#1A40C7", // 메인 컬러
      secondary: "#061537", // appBar, 전사 안전사고 발생 현황 카드
      warning: "#E51C1C", //빨간색

      textLabel: "#C1C5CD",
      textBtn: "#8D8EA7", //btnBase text color, 누적btn color

      cardBase: "#344262", // 안전사고 상세 card bg

      chipBase: "#061537", // 누적 btn bg
      cardBase: "rgba(17, 32, 66, 0.85)", //안전점검 현황, 안전수칙 위반 현황 카드, 부문별 안전 kpi현황 카드
      btnBase: "#2C3D65", //안전사고, 안전점검 등등 하단 btn bg
      inputBase: "#616A82" //date input

    },
  },
};
export default theme;
