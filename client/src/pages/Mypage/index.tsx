import { getImageUrl } from '@/utils';
import { SectionHeader } from '@components/ui/SectionHeader';
import { PlaceMin, MailMin, PhoneMin, Edit } from '@/assets/images/icons';

export default function Mypage() {
  return (
    <>
      <section className="flex flex-col gap-y-5">
        <div className="flex items-center gap-x-14 rounded-md border border-gray-300 px-20 py-6">
          <div className="relative aspect-square w-36 overflow-hidden rounded-[50%]">
            <img src={getImageUrl('dummy/profile')} alt="프로필 이미지" className="h-full w-full object-cover" />
          </div>
          <div className="text-base font-medium tracking-tight text-gray-950">
            <div className="flex items-center gap-x-1.5 text-[.875em] text-gray-500">
              Seoul, Korea <PlaceMin className="inline-block size-3.5" />
            </div>
            <div className="my-2.5">
              <strong className="block text-[1.5em] font-bold">Yeaji Kim</strong>
              Front-end Developer
            </div>
            <ul className="flex items-center gap-x-4 text-[.875em] font-normal">
              <li className="flex items-center gap-x-1.5">
                <MailMin className="size-5" />
                <span>yeaji.kim@pmgasia.com</span>
              </li>
              <li className="flex items-center gap-x-1.5">
                <PhoneMin className="size-5" />
                <span>010-0000-0000</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-gray-300 px-18.5 py-12.5">
          <SectionHeader
            title="프로필 수정"
            buttonText="수정"
            buttonIcon={<Edit className="size-4" />}
            onButtonClick={() => console.log('프로필 수정')}
          />
          <div className="grid grid-cols-4 tracking-tight">
            <div className="text-base leading-[1.5] text-gray-700">
              <strong className="block text-[1.14em] font-bold text-gray-950">팀 이름</strong>
              <span>Developer Team</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
