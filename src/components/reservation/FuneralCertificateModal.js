import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space } from 'antd';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';

// 로고 SVG 컴포넌트 (작은 로고와 큰 백그라운드 로고용)
const LogoSvg = ({ size = 'small' }) => {
  const width = size === 'large' ? 200 : 80;
  const height = size === 'large' ? 200 : 80;
  return (
    <svg width={width} height={height} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="46" fill="white" stroke="#1e40af" strokeWidth="2"/>
      <path d="M48 18C38.5 18 31 25.5 31 35C31 44.5 38.5 52 48 52C57.5 52 65 44.5 65 35C65 25.5 57.5 18 48 18ZM48 48C40.8 48 35 42.2 35 35C35 27.8 40.8 22 48 22C55.2 22 61 27.8 61 35C61 42.2 55.2 48 48 48Z" fill="#1e40af"/>
      <path d="M73 62.5C71.8 61.3 70.2 60.5 68.5 60.5H27.5C25.8 60.5 24.2 61.3 23 62.5C21.8 63.7 21 65.3 21 67V78H27V67C27 66.4 27.4 66 28 66H68C68.6 66 69 66.4 69 67V78H75V67C75 65.3 74.2 63.7 73 62.5Z" fill="#1e40af"/>
      <path d="M48 38C49.6569 38 51 36.6569 51 35C51 33.3431 49.6569 32 48 32C46.3431 32 45 33.3431 45 35C45 36.6569 46.3431 38 48 38Z" fill="#1e40af"/>
    </svg>
  );
};

// 직인 SVG 컴포넌트
const StampSvg = () => (
  <svg width="80" height="80" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="48" cy="48" r="46" fill="none" stroke="#FF0000" strokeWidth="2"/>
    <circle cx="48" cy="48" r="40" fill="none" stroke="#FF0000" strokeWidth="1"/>
    <text x="48" y="40" textAnchor="middle" fill="#FF0000" style={{ font: 'bold 12px Arial' }}>씨엘로펫</text>
    <text x="48" y="60" textAnchor="middle" fill="#FF0000" style={{ font: 'bold 10px Arial' }}>대표이사</text>
  </svg>
);

export const FuneralCertificateModal = ({ visible, onCancel, reservation }) => {
  const componentRef = useRef();

  const clientInfo = {
    name: reservation?.customer?.name || '',
    phone: reservation?.customer?.phone || '',
    address: reservation?.customer?.address || '',
    email: reservation?.customer?.email || '',
  };
  
  const petInfo = {
    name: reservation?.pet?.name || '',
    species: reservation?.pet?.species || '',
    breed: reservation?.pet?.breed || '',
    age: reservation?.pet?.age || '',
    weight: reservation?.pet?.weight || '',
    death_date: reservation?.pet?.death_date ? new Date(reservation?.pet?.death_date).toLocaleDateString() : '',
  };

  // 한글 폰트 로드
  useEffect(() => {
    const loadFont = async () => {
      try {
        const pdf = new jsPDF();
        pdf.setFont('helvetica'); // 기본 폰트 사용
      } catch (error) {
        console.error('PDF 폰트 설정 오류:', error);
      }
    };
    loadFont();
  }, []);

  const generatePDF = async () => {
    try {
      const element = componentRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save('장례확인서.pdf');
    } catch (error) {
      console.error('PDF 생성 오류:', error);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: '장례확인서',
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        html, body {
          height: 100%;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `,
  });

  const PrintableComponent = () => (
    <div 
      ref={componentRef} 
      className="w-[210mm] min-h-[297mm] bg-white relative mx-auto"
      style={{
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid'
      }}
    >
      {/* 백그라운드 로고 (크게, 투명도 낮게) */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 opacity-10 pointer-events-none">
        <LogoSvg size="large" />
      </div>

      {/* 콘텐츠 컨테이너 */}
      <div className="px-10 py-8 h-full flex flex-col justify-between border border-gray-300">
        {/* 헤더 및 문서 번호 */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-20">
            <LogoSvg />
          </div>
          <div className="text-sm text-gray-600">
            - 영업장 등록번호 제 4050000-038-2020-0001
          </div>
        </div>

        {/* 제목 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">장 례 확 인 서</h1>
          <p className="text-base text-gray-600 mt-2">(Cremation Certificate)</p>
        </div>

        {/* 의뢰인 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800">의뢰인 정보 (Funeral Client Information)</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              <tr>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50">성함<br/>(Name)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.name}</td>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50">동물병원<br/>(Vet clinic)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center"></td>
              </tr>
              <tr>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50">주소<br/>(Address)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.address}</td>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50">전자우편 주소<br/>(E-mail)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.email}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50">연락처<br/>(Contact No.)</td>
                <td className="py-2 border border-gray-300 text-center">{clientInfo.phone}</td>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center bg-gray-50"></td>
                <td className="py-2 border border-gray-300 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 반려동물 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800">반려동물 정보 (Pet Information)</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              <tr>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">소유자 성함<br/>(Owner's Name)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{petInfo.name}</td>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">소유자 연락처<br/>(Owner's Contact No.)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.phone}</td>
              </tr>
              <tr>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">소유자 주소<br/>(Owner's Address)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.address}</td>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">소유자 전자우편 주소<br/>(Owner's E-mail)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{clientInfo.email}</td>
              </tr>
              <tr>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">나이<br/>(Age)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{petInfo.age}</td>
                <td className="py-2 w-40 font-medium border border-gray-300 text-gray-700 text-center">체중<br/>(Weight)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{petInfo.weight}kg</td>
              </tr>
              <tr>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center">사망일<br/>(Date of death)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{petInfo.death_date}</td>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center">품종<br/>(Species)</td>
                <td className="py-2 border border-gray-300 flex-1 text-center">{petInfo.species}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium border border-gray-300 text-gray-700 text-center">잔재의 처리 방법</td>
                <td className="py-2 border border-gray-300 flex-1 text-center" colSpan="3">장례 의뢰인에게 전달</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 확인 문구 및 날짜/직인 */}
        <div className="text-center">
          <p className="text-lg mb-6">
            위 반려동물은 <u>  {new Date().getFullYear()} 년 {new Date().getMonth() + 1} 월 {new Date().getDate()} 일</u>  <br />
            반려동물 장례식장 「씨엘로펫」에서 장례화장을 진행하였음을 증명합니다.
          </p>
          
          <div className="text-lg text-right mb-4">
            {new Date().getFullYear()}년 {String(new Date().getMonth() + 1).padStart(2, '0')}월 {String(new Date().getDate()).padStart(2, '0')}일
          </div>
          <div className="w-full flex justify-center items-center">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">씨 엘 로 펫</div>
              <div className="w-20">
                <StampSvg />
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-600 mt-8">
          경기도 용인시 처인구 백암면 청계로 1206 / 1577-7332 / cielopet@naver.com
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      width="fit-content"
      centered
      footer={[
        <Space key="footer" className="flex justify-start">
          <Button onClick={generatePDF} type="primary" className="!bg-blue-800 hover:!bg-blue-900">
            PDF로 다운로드
          </Button>
          <Button onClick={handlePrint} type="primary" className="!bg-green-700 hover:!bg-green-800">
            바로 출력
          </Button>
          <Button onClick={onCancel}>
            닫기
          </Button>
        </Space>
      ]}
    >
      <PrintableComponent />
    </Modal>
  );
};