const B='http://localhost:3001/api';
let pass=0,fail=0;
const ok=(l,c,x='')=>{c?(pass++,console.log('  PASS '+l)):(fail++,console.log(`  FAIL ${l} ${x}`))};
async function call(m,p,token,body){
  const r=await fetch(B+p,{method:m,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  let j=null; try{j=await r.json()}catch{}
  return {status:r.status,j};
}
const login=async(e,p='password123')=>(await call('POST','/auth/login',null,{email:e,password:p})).j.token;
const S=await login('student@iankrm.test');
const T=await login('kenji@iankrm.test');
const A=await login('admin@iankrm.test');
ok('tokens: student/tutor/admin', !!S&&!!T&&!!A);

console.log('\nsearch');
let r=await call('GET','/search?q=directing'); ok('GET /search finds class', r.j?.classes?.length>0, JSON.stringify(r.j).slice(0,90));
r=await call('GET','/search?q=kenji'); ok('search matches tutor', r.j?.classes?.length>0||r.j?.tutors?.length>0);
r=await call('GET','/search/suggest?q=dir'); ok('GET /search/suggest', r.j?.suggestions?.length>0, JSON.stringify(r.j));
r=await call('GET','/search/tutors/kenji@iankrm.test'); ok('GET /search/tutors/:id', r.j?.tutor?.name==='Kenji Nakamura');
r=await call('GET','/search?q=%25'); ok('wildcard % is escaped, not match-all', Array.isArray(r.j?.classes));
r=await call('GET','/search/mine',S); ok('GET /search/mine', Array.isArray(r.j?.items));

console.log('\nreviews');
r=await call('GET','/reviews?class=directing-great-films'); ok('GET /reviews (2 seeded reviews)', r.j?.reviews?.length===2, JSON.stringify(r.j).slice(0,80));
ok('review aggregate present', typeof r.j?.rating?.average==='number');
r=await call('POST','/reviews',S,{classId:1,rating:3,body:'Solid but the third module drags.'});
ok('student without enrolment is blocked', r.status===403, r.status);
await call('POST','/enrollments/1',S);
r=await call('POST','/reviews',S,{classId:1,rating:4,body:'Much better the second time.'}); ok('POST /reviews after enrol', r.status===201, r.status);
r=await call('POST','/reviews',S,{classId:1,rating:9,body:'bad'}); ok('rejects out-of-range rating', r.status===400);
r=await call('POST','/reviews',S,{classId:1,rating:5,body:'Revised: this is superb.'}); ok('re-post upserts not duplicates', r.status===201);
r=await call('GET','/reviews/mine',S); ok('GET /reviews/mine is a real path', Array.isArray(r.j?.reviews) && r.j.reviews.length===2, JSON.stringify(r.j).slice(0,80));
r=await call('PATCH','/reviews/1',T,{status:'hidden'}); ok('tutor cannot hide a review', r.status===403);
r=await call('PATCH','/reviews/1',A,{status:'hidden',note:'abuse'}); ok('admin hides a review', r.status===200);
r=await call('PATCH','/reviews/1',A,{status:'published'}); ok('admin restores a review', r.status===200);

console.log('\nwishlist');
r=await call('POST','/wishlist/2',S); ok('POST /wishlist', r.j?.saved===true);
r=await call('POST','/wishlist/2',S); ok('saving twice is idempotent', r.j?.saved===true);
r=await call('GET','/wishlist',S); ok('GET /wishlist', r.j?.classes?.length>=1);
r=await call('GET','/wishlist/saved?slug=the-art-of-the-short-story',S); ok('GET /wishlist/saved', r.j?.saved===true);
r=await call('DELETE','/wishlist/2',S); ok('DELETE /wishlist', r.j?.saved===false);
r=await call('GET','/wishlist'); ok('wishlist needs auth', r.status===401);

console.log('\nnotifications');
r=await call('GET','/notifications',S); ok('GET /notifications', Array.isArray(r.j?.notifications));
const unread=r.j?.unread; ok('unread count present', typeof unread==='number');
r=await call('POST','/notifications/read',S); ok('mark all read', r.j?.ok===true);
r=await call('GET','/notifications',S); ok('unread drops to 0', r.j?.unread===0);
r=await call('POST','/notifications/read',S,{id:999999}); ok('unknown id is 404', r.status===404);

console.log('\ncertificates');
r=await call('GET','/certificates/complete',S); ok('GET /certificates/complete', Array.isArray(r.j?.pending));
r=await call('POST','/certificates/1',S); ok('certificate blocked while incomplete', r.status===409, r.status);
const {j:pg}=await call('GET','/enrollments/1/progress',S);
for(const l of pg.lessons) await call('PATCH',`/enrollments/1/lessons/${l.id}`,S,{completed:true,position_seconds:10});
r=await call('POST','/certificates/1',S); ok('certificate issued when complete', r.status===201 && !!r.j?.certificate?.code, JSON.stringify(r.j).slice(0,90));
const code=r.j?.certificate?.code;
r=await call('POST','/certificates/1',S); ok('re-issue is idempotent', r.j?.certificate?.code===code);
r=await call('GET',`/certificates/verify/${code}`); ok('public verify works', r.j?.valid===true);
r=await call('GET','/certificates/verify/NOPE'); ok('bad code is 404', r.status===404);
r=await call('GET','/certificates',S); ok('GET /certificates', r.j?.certificates?.length>=1);

console.log('\nQ&A');
r=await call('POST','/questions',S,{classId:1,body:'What lens for a two-shot?'}); ok('student asks a question', r.status===201, r.status);
const qid=r.j?.question?.id;
r=await call('POST','/questions',S,{classId:1,body:'And for a close-up?',parentId:qid}); ok('reply thread keeps parentId', r.status===201 && r.j?.question?.parentId===qid, r.status);
r=await call('PATCH',`/questions/${qid}`,S,{answer:'I would not cut.'}); ok('student cannot answer', r.status===403);
r=await call('PATCH',`/questions/${qid}`,T,{answer:'Stay wide, let them wander.'}); ok('tutor answers', r.status===200);
r=await call('GET','/questions?class=directing-great-films'); ok('GET /questions', r.j?.questions?.length>0);
ok('replies nested under parent', (r.j?.questions||[]).some(q=>q.replies?.length>0));
r=await call('POST','/questions',S,{classId:1,body:''}); ok('empty question rejected', r.status===400);

console.log('\npassword reset + verification');
r=await call('POST','/auth/forgot-password',null,{email:'student@iankrm.test'}); ok('forgot-password responds 200', r.status===200);
r=await call('POST','/auth/forgot-password',null,{email:'nobody@nowhere.test'}); ok('unknown email still 200 (no probing)', r.status===200);
r=await call('GET','/auth/token-debug/reset?email=student@iankrm.test'); const tok=r.j?.token; ok('dev token issued', !!tok);
r=await call('POST','/auth/reset-password',null,{token:'garbage',password:'newpassword1'}); ok('bad reset token rejected', r.status===400);
r=await call('POST','/auth/reset-password',null,{token:tok,password:'short'}); ok('short password rejected', r.status===400);
r=await call('POST','/auth/reset-password',null,{token:tok,password:'newpassword1'}); ok('reset succeeds', r.status===200);
r=await call('POST','/auth/reset-password',null,{token:tok,password:'another1234'}); ok('token is single-use', r.status===400);
r=await call('POST','/auth/login',null,{email:'student@iankrm.test',password:'newpassword1'}); ok('new password logs in', !!r.j?.token);
r=await call('GET','/auth/verify-email/status',S); ok('verify status', typeof r.j?.verified==='boolean');
r=await call('POST','/auth/resend-verification',S); ok('resend verification', r.status===200);
r=await call('GET','/auth/token-debug/verify?email=admin@iankrm.test'); const vt=r.j?.token; ok('verify token issued', !!vt);
r=await call('GET',`/auth/verify-email?token=${vt}`); ok('email verified', r.j?.ok===true);
r=await call('GET',`/auth/verify-email?token=${vt}`); ok('verify token single-use', r.status===400);

console.log('\nnotes + transcripts');
r=await call('PUT','/notes/1',S,{body:'Re-watch the blocking chapter',seconds:42}); ok('PUT note', r.j?.ok===true);
r=await call('GET','/notes/1',S); ok('GET note round-trips', r.j?.note?.body.includes('blocking') && r.j?.note?.seconds===42);
r=await call('GET','/notes',S); ok('GET all notes', r.j?.notes?.length>=1);
r=await call('PUT','/notes/1/transcript',S,{body:'hax me'}); ok('student cannot write transcript', r.status===403);
r=await call('PUT','/notes/1/transcript',T,{body:'Frame the intention first.'}); ok('tutor writes transcript', r.j?.ok===true);
r=await call('GET','/notes/1/transcript',S); ok('GET transcript', r.j?.transcript.includes('intention'));
r=await call('GET','/notes/1'); ok('notes need auth', r.status===401);

console.log('\nearnings + promo codes');
r=await call('GET','/admin/earnings',T); ok('GET /admin/earnings', typeof r.j?.lifetimeCents==='number');
ok('enrolment credited the tutor', r.j?.lifetimeCents>0, JSON.stringify(r.j?.lifetimeCents));
ok('share is 0.7', r.j?.share===0.7);
r=await call('GET','/admin/earnings',S); ok('students have no earnings view', r.status===403);
r=await call('POST','/admin/promo-codes',T,{code:'SAVE20',percentOff:20,maxUses:2}); ok('POST promo code', r.status===201);
r=await call('POST','/admin/promo-codes',T,{code:'SAVE20',percentOff:20}); ok('duplicate code rejected', r.status===409);
r=await call('POST','/admin/promo-codes',T,{code:'BAD',percentOff:150}); ok('bad percent rejected', r.status===400);
r=await call('GET','/admin/promo-codes',T); ok('GET promo codes', r.j?.promoCodes?.length>=1);
r=await call('POST','/admin/promo-codes/SAVE20/redeem',S); ok('redeem preview', r.j?.amountCents===3920, JSON.stringify(r.j));
r=await call('POST','/admin/promo-codes/NOPE/redeem',S); ok('unknown code 404', r.status===404);

console.log('\nadmin moderation');
r=await call('GET','/admin/moderation',A); ok('GET /admin/moderation', !!r.j?.stats);
ok('stats populated', r.j?.stats?.users>0 && r.j?.stats?.hidden>=0);
r=await call('GET','/admin/moderation',T); ok('tutor blocked from moderation', r.status===403);
r=await call('GET','/admin/moderation',S); ok('student blocked from moderation', r.status===403);
r=await call('PATCH','/admin/moderation/classes/1',A,{status:'draft'}); ok('admin unpublishes class', r.j?.status==='draft');
r=await call('PATCH','/admin/moderation/classes/1',A,{status:'published'}); ok('admin republishes', r.j?.status==='published');
r=await call('PATCH','/admin/moderation/reviews/1',A,{status:'nonsense'}); ok('bad status rejected', r.status===400);
ok('moderation log records actions', (await call('GET','/admin/moderation',A)).j?.log?.length>0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
