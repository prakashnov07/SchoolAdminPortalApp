import React, { createContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const initialStudentPosts = [
  {
    id: '1',
    title: 'School Science Fair 2025',
    description:
      'Amazing projects showcased by our talented students at the Annual Science Fair! Check out these incredible innovations and experiments.',
    photos: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    ],
  },
   {
    id: '2',
    title: 'School Science Fair 2025',
    description:
      'Amazing projects showcased by our talented students at the Annual Science Fair! Check out these incredible innovations and experiments.',
    photos: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

export const CoreContext = createContext();

export function CoreProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [phone, setPhone] = useState('');
  const [verified, setVerified] = useState(''); // ok , fail
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [classUrl, setClassUrl] = useState('');
  const [cmo, setCmo] = useState(0);
  const [appUrl] = useState('https://schoolapi.siddhantait.com');
  const [schoolData, setSchoolData] = useState({ studentimgpath: '' });
  const [messageId, setMessageId] = useState('');
  const [isUpdateNeeded, setIsUpdateNeeded] = useState('yes');
  const [branchid, setBranchid] = useState('');
  const [branch, setBranch] = useState({});
  const [grpBranches, setGrpBranches] = useState([]);
  const [class_url, setClass_url] = useState('');
  const [status, setStatus] = useState('active');
  const [role, setRole] = useState('student'); //user,admin,super,student,enquiry
  const [utype, setUtype] = useState('parent'); //perent, school
  const [id, setId] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [emails, setEmails] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('');
  const [imgDocs, setImgDocs] = useState([]);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [staffcalendarAttendanceDetails, setStaffcalendarAttendanceDetails] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [studentsForAttendance, setStudentsForAttendance] = useState([]);
  const [studentAttendanceDetails, setStudentAttendanceDetails] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCached, setIsCached] = useState(false);
  const [months] = useState([
    { id: 1, name: 'April' },
    { id: 2, name: 'May' },
    { id: 3, name: 'June' },
    { id: 4, name: 'July' },
    { id: 5, name: 'August' },
    { id: 6, name: 'September' },
    { id: 7, name: 'October' },
    { id: 8, name: 'November' },
    { id: 9, name: 'December' },
    { id: 10, name: 'January' },
    { id: 11, name: 'February' },
    { id: 12, name: 'March' }
  ]);


  const checkIfVerified = (navigation) => {
    getAsyncData(navigation);
  };

  const getGroupBranches = async () => {
    const value = await AsyncStorage.getItem('@schoolapp:core');
    let branchid = '';
    if (value) {
      try {
        const parsed = JSON.parse(value);
        branchid = parsed.branchid;
      } catch (e) {
        console.log('Error parsing core value', e);
      }
    }

    let grpBranches = [];
    const groupBranches = unhydrate('@schoolapp:groupBranches');
    if (groupBranches) {
      groupBranches.then((data) => {
        grpBranches = data;
        setGrpBranches(data);
        if (branchid) {
          const branch = grpBranches.find(b => b.branchid === branchid);
          setBranch(branch);
        }
      });
    }

    if (grpBranches.length < 1) {
      axios.get('/getgroupbranches')
        .then((response) => {
          setGrpBranches(response.data.groupbranches);
          // console.log(response.data.groupbranches);
          if (response.data.groupbranches.length > 0) {
            hydrate('@schoolapp:groupBranches', response.data.groupbranches);
            if (branchid) {
              const branch = response.data.groupbranches.find(b => b.branchid === branchid);
              setBranch(branch);
            }
          }
        })
        .catch();
    }
  };

  const fetchAllBranches = () => {
    // Legacy getGroupBranchesTech logic
    axios.get('/getallbranches', { params: { branchid } })
      .then((response) => {
        if (response.data && response.data.allbranches) {
          setGrpBranches(response.data.allbranches);
          if (response.data.allbranches.length > 0) {
            hydrate('@schoolapp:groupBranches', response.data.allbranches);
          }
          showToastMessage('Branch data refreshed successfully');
        } else {
          showToastMessage('No branches found');
        }
      })
      .catch(err => {
        console.log(err);
        showToastMessage('Failed to refresh branch data');
      });
  };


  const hydrate = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      console.log('success storing messages');
    } catch (error) {
      //  Error saving data
      console.log('error storing message' + error);
    }
  };

  const unhydrate = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      } return [];
    } catch (error) {
      return [];
    }
  };

  const resetStudentsForAttednance = () => {
    setStudentsForAttendance([]);
  };

  const searchStudentsByClassForAttendance = (classid, sectionid, filter = '', action = '') => {
    //console.log(classid, sectionid, filter, action);

    const owner = phone;
    axios.get('/search-by-class-v4', { params: { classid, sectionid, filter, action, owner, branchid } })
      .then(response => {
        setStudentsForAttendance(response.data.rows);

        if (response.data.rows.length === 0) { showToastMessage('No students to show'); }
      });
  };


  const searchStudentsByClass = (classid, sectionid, filter = '', action = '') => {
    setLoading(true);
    const owner = phone;
    axios.get('/search-by-class-v2', { params: { classid, sectionid, filter, action, owner, branchid } })
      .then(response => {
        setLoading(false);
        setSelectedStudents(response.data.rows);
        console.log('selected students', response.data.rows);
        if (response.data.rows.length === 0) { showToastMessage('No students to show'); }
      });
  };

  const filterStudent = (query) => {
    if (query) {
      axios.get('filter-search-student-2', { params: { filter: query, branchid } }).then((response) => {
        setSelectedStudents(response.data.allStudents);

        if (response.data.allStudents.length === 0) showToastMessage('No students to show');
      });
    } else showToastMessage('Please enter some text.. ');

  }

  const searchStudent = (id, searchBy) => {
    //  console.log('searching student');

    setLoading(true);
    const selectedStudents = studentsForAttendance;
    const student = searchBy === 'enroll' ? selectedStudents.find(stu => stu.enrollment === id) : searchBy === 'scholar' ? selectedStudents.find(stu => stu.scholarno === id) : selectedStudents.find(stu => stu.enrollment === id);
    // console.log(student);

    if (student) { setSelectedStudents([student]); setLoading(false); }
    else {
      setSelectedStudents([]);
      getAdminStudent(id, searchBy);
    }
    // console.log('see');
    //  console.log(getState().advanceReducer.students[0]);

  };

  const getAdminStudent = (regno, searchBy) => {
    setLoading(true);
    const regnos = [regno];
    //console.log(regnos);
    axios.get('/fetchstudentdetails', { params: { regnos, searchBy, branchid } })
      .then(response => {
        setLoading(false);
        if (response.data.students.length > 0)
          setSelectedStudents(response.data.students);

        //  console.log(response.data.students)
        if (regno)
          if (response.data.students.length === 0) showToastMessage('No student found !');
      });
  };


  const todayDiff = (d) => {

    const date1 = new Date();
    const date2 = new Date(d);
    // If date is invalid, return 0 to keep the message safe, or handle appropriately
    if (isNaN(date2.getTime())) return 0;

    const diffTime = Math.abs(date2.getTime() - date1.getTime()); // milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;

  };

  const uploadSingleImage = (id, files, o, b, title, classid, sectionid) => {

    axios.post('/upload-single-image', { id, filepath: JSON.stringify(files), owner: o, branchid: b, title, classid, sectionid }).then(response => {
      return response.data.path;
    });
  }

  const fetchCategories = () => {
    axios.get('/getcategories', { params: { branchid } })
      .then(response => {
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
      });
  };

  const markMessageAsRead = (id) => {

    const messageStorage = '@schoolapp:messages:' + branchid;
    axios.post('/markasread', { id, role }).then((response) => {

      const messagesWithNewStatus = messages.map(msg => {
        if (msg.id === id) {
          msg.isread = 'yes';
          msg.rtime = response.data.msg_read_time;
        }
        return msg;
      });

      setMessages(messagesWithNewStatus);

      hydrate(messageStorage, messagesWithNewStatus);

    })
  };

  const fetchSubjects = () => {
    const subjects = unhydrate('@schoolapp:subjects');
    if (subjects) {
      subjects.then((data) => {
        setSubjects(data);
      });
    }

    axios.get('/getsubjects', { params: { branchid } })
      .then(response => {
        const subjectsData = response.data.subjects || response.data.rows;
        if (subjectsData) {
          setSubjects(subjectsData);
          hydrate('@schoolapp:subjects', subjectsData);
        }
      });
  };

  const fetchRoles = () => {
    axios.get('/getroles', { params: { branchid } })
      .then(response => {
        if (response.data && response.data.roles) {
          setRoles(response.data.roles);
        }
      });
  };

  const fetchFeedbacks = (astatus) => {
    //  console.log('branchid', branchid);
    axios.get('fetchfeedbacks', { params: { branchid, astatus, owner: phone, role: role } }).then(response => {
      if (response.data && response.data.filteredFeedbacks) {
        setFeedbacks(response.data.filteredFeedbacks);
      }
    });
  };

  const fetchStaffs = (filter) => {
    axios.get('/fetchstaffs', { params: { branchid, filter } })
      .then((response) => {
        if (response.data && response.data.staffs) {
          setStaffs(response.data.staffs);
        }
      });
  };

  const cacheStudents = () => {
    axios.post('/cache-students', { owner: phone, branchid })
      .then(() => {
        showToastMessage('Students cached successfully...');
        setIsCached(true);
      });
  };


  const checkFcmToken = (token) => {
    // const owner = getState().core.phone; // In context we have phone
    // const role = getState().core.role;
    // const branchid = getState().core.branchid;
    // console.log('token', token);
    axios.post('/checkfcmtoken', { token, owner: phone, role, branchid });
  };

  const checkStudentAttendance = (redirect) => {
    // const branchid = getState().core.branchid;
    // const enrid = getState().core.id;
    axios.get('checkstudentattendancestatus', { params: { branchid, enrid: id, action: redirect } }).then(response => {
      // This updated ATTENDANCE_STATUS in Redux.
      // If we need this data, we should probably store it in local state or return it.
      // For now, I'm just porting the side effect.
      // Actions.studentCards() was called if unmarked/absent && redirect === 'yes'
      if ((response.data.status === 'unmarked' || response.data.status === 'absent') && redirect === 'yes') {
        // Navigation not available here directly, might need to handle in component
      }
    });
  };

  const addAllEnqiryNo = () => {
    // const phone = getState().core.phone;
    // const branchid = getState().core.branchid;
    axios.get('/addallenquiryno', { params: { phone, branchid } })
      .then(async (response) => {
        const { test, enqs } = response.data;
        try {
          const newregnos = test;
          setEnquiries(enqs); // Assuming we can use the state 'enquiries' from CoreContext line 54
          // And update 'id' if needed similar to redux logic
          const value = await AsyncStorage.getItem('@schoolapp:core');
          if (value !== null) {
            const core = JSON.parse(value);
            const newValue = { ...core, id: newregnos, branchid: branchid };
            // dispatch(setCoreValues(newValue)); -> setId, setBranchid in Context
            setId(newregnos);
            setBranchid(branchid);

            // also should update storage
            try {
              await AsyncStorage.setItem('@schoolapp:core', JSON.stringify(newValue));
            } catch (error) { }
          }

        } catch (error) {
          console.log(error);
        }
      });
  };

  const addAllRegistrationNo = () => {
    // const phone = getState().core.phone; // phone from context
    // const branchid = getState().core.branchid; // branchid from context
    // const regnos = getState().core.id; // id from context

    axios.get('/addallregistrationno', { params: { phone, branchid } })
      .then(async (response) => {
        const { test, testt, email } = response.data;

        if (id.length !== test.length) { // id is regnos
          const diffKey = '@schoolapp:messages:' + branchid;
          try {
            await AsyncStorage.removeItem(diffKey);
          } catch (error) {
          }
        }

        try {
          const newregnos = test;
          const newschonos = testt;
          const emails = email;
          // Value reading from async storage might be redundant if we trust checks?
          // keeping implementation consistent
          const value = await AsyncStorage.getItem('@schoolapp:core');
          if (value !== null) {
            const core = JSON.parse(value);
            const newValue = { ...core, id: newregnos, branchid: branchid, scholars: newschonos, emails: emails };
            // dispatch(setCoreValues(newValue)); -> context setters
            setId(newregnos);
            setBranchid(branchid);
            setScholars(newschonos);
            setEmails(emails);

            try {
              await AsyncStorage.setItem('@schoolapp:core', JSON.stringify(newValue));
            } catch (error) {
              // Error saving data
            }
          }
        } catch (error) {
          console.log(error);
        }
      });
  };


  const fetchSqlMessages = () => {

    loadSqlMessages_3();

  }

  const loadSqlMessages_3 = async () => {

    const value = await AsyncStorage.getItem('@schoolapp:core');
    const ls = JSON.parse(value);

    const owner = phone ? phone : ls?.phone;
    const ro = ls?.role;
    const br = branchid ? branchid : ls?.branchid;
    const enrid = id ? id : ls?.id;
    const pw = ls?.pwa_token;
    const ut = ls?.utype;


    const messageStorage = '@schoolapp:messages:' + br;
    const messages = unhydrate(messageStorage);

    let lastMessageId = 0;


    messages.then((data) => {
      if (data.length > 0) {
        lastMessageId = data[0].id;
        // console.log('getting new messages', lastMessageId);

        setMessages(data);


        axios.get('/home-page-messages-2', { params: { enrid, id: lastMessageId, role: ro, owner, branchid: br } })
          .then((response) => {
            // var arrayWithUniqueValues = value.filter((v, i, a) => a.indexOf(v) === i);

            const fetchedMessages = response.data?.messages ?? [];

            const allMessages = [...fetchedMessages, ...data];
            const uniqueMessages = allMessages.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

            const homePageMessages = uniqueMessages.filter((um) => {
              const mdate = um.dat.split(' ')[0];
              if (todayDiff(mdate) <= 30) return um;
            });

            // console.log('New Messages', allMessages);

            setMessages(homePageMessages);

            hydrate(messageStorage, homePageMessages);

            // if there are scheduled messages read then send notification to otherss
            const schMessages = response.data?.scheduledMessages ?? [];
            if (schMessages?.length > 0) {
              const schMessage = schMessages[0];
              axios.post('/sendnotification', { title: schMessage.title, content: schMessage.content, classid: schMessage.classid, sectionid: schMessage.sectionid, branchid: br });
            }

          }).catch(err => console.log(err));
      }
      else {
        // console.log('getting all messages', lastMessageId);
        axios.get('/home-page-messages-2', { params: { enrid, id: lastMessageId, role: ro, owner, branchid: br } })
          .then((response) => {

            //   console.log('all messages', response.data.messages);
            const fetchedMessages = response.data?.messages ?? [];
            setMessages(fetchedMessages);

            hydrate(messageStorage, response.data.messages);

            // if there are scheduled messages read then send notification to otherss

            const schMessages = response.data?.scheduledMessages ?? [];
            if (schMessages?.length > 0) {
              const schMessage = schMessages[0];
              axios.post('/sendnotification', { title: schMessage.title, content: schMessage.content, classid: schMessage.classid, sectionid: schMessage.sectionid, branchid: br });
            }

          }).catch(err => console.log(err));;
      }

    });

  };

  const getSchoolData = async () => {
    const value = await AsyncStorage.getItem('@schoolapp:core');
    const ls = JSON.parse(value);
    const br = branchid ? branchid : ls?.branchid;

    axios.get('/getschooldata', { params: { branchid: br } })
      .then((response) => {

        setSchoolData(response.data.schooldata);

        //   console.log('schooldata', response.data);
        //  getVersion(isUpdateNeeded, response.data.schooldata.current_version);
      });

  };

  const hasTabPermission = (url) => {

    if (role === 'super' || role === 'tech') return true;

    if (!allowedTabs || !Array.isArray(allowedTabs)) return false;

    for (let tab of allowedTabs) {

      if (tab.tab_name === url) { return true; }
    }

    return false;

  };


  const getAllowedTabs = async () => {

    const value = await AsyncStorage.getItem('@schoolapp:core');
    const ls = JSON.parse(value);
    const ro = ls?.role;
    const br = branchid ? branchid : ls?.branchid;

    const allowedTabs = unhydrate('@schoolapp:allowedtabs');

    if (allowedTabs) {
      allowedTabs.then((data) => {
        setAllowedTabs(data);
      });
    }

    axios.get('/fetchallowedtabs', { params: { role: ro, branchid: br } })
      .then((response) => {
        setAllowedTabs(response.data.tabs);
        hydrate('@schoolapp:allowedtabs', response.data.tabs);
      });
  };


  const getAllStaffs = () => {

    axios.get('/fetchstaffs', { params: { branchid } })
      .then((response) => {
        setStaffs(response.data.staffs);
        //console.log(response.data.staffs);
      });
  };



  const updateClassUrl = async (url) => {
    setClassUrl(url);
    try {
      const value = await AsyncStorage.getItem('@schoolapp:core');
      if (value !== null) {
        const core = JSON.parse(value);
        const newValue = { ...core, classUrl: url };
        await AsyncStorage.setItem('@schoolapp:core', JSON.stringify(newValue));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const deleteAsyncData = async (branchid) => {

    try {
      const messageStorage = '@schoolapp:messages:' + branchid;
      await AsyncStorage.removeItem('@schoolapp:core');
      await AsyncStorage.removeItem(messageStorage);
      console.log('key removed');
    } catch (error) {
      console.log('error');
      console.log(error);
    }

  }

  const checkUserValidity = async (navigation) => {


    const value = await AsyncStorage.getItem('@schoolapp:core');
    const ls = JSON.parse(value);

    const ph = phone ? phone : ls?.phone;
    const ro = ls?.role;
    const br = branchid ? branchid : ls?.branchid;
    const enrid = id ? id : ls?.id;
    const pw = ls?.pwa_token;
    const ut = ls?.utype;

    setCoreValues(ph, enrid, br, verified, ro, ut);



    axios.get('/checkuservalidity', { params: { owner: ph, role: ro, branchid: br } })
      .then(response => {
        const test = response.data.test;
        console.log('test', test);

        if (test) {
          updateClassUrl(test.class_url);



          if (test.verified === 'fail') { //fail
            deleteAsyncData(branchid);
            setCoreValues('', '', branchid, '', '', 'deleted');

            // Navigate to Warning
            if (navigation) navigation.navigate('Warning');
          }
          else {
            if (test.status === 'app_reg_ini') {
              if (role === 'enquiry') {
                setTimeout(() => {
                  if (navigation) navigation.navigate('Home', { reg: enrid[0], store_in: 'application' });
                }, 1000);
              }
              else {
                setTimeout(() => {
                  if (navigation) navigation.navigate('Home', { reg: enrid[0], store_in: 'student' });
                }, 1000);
              }

            }
            else if (test.status === 'app_reg_class') {
              setTimeout(() => {
                if (navigation) navigation.navigate('Home', { reg: enrid[0] });
              }, 1000);

            } else if (test.status === 'enrolled') {

              axios.get('/addallregistrationno', { params: { phone: ph, branchid: br } })
                .then(async (response1) => {
                  const { testt, email } = response1.data;
                  const test1 = response1.data.test;

                  if (enrid.length !== test1.length) {
                    const diffKey = '@schoolapp:messages:' + br;

                    try {
                      await AsyncStorage.removeItem(diffKey);
                    } catch (error) {
                    }
                  }

                  try {
                    const newregnos = test1;
                    const newschonos = testt;
                    const emails = email;
                    const value = await AsyncStorage.getItem('@schoolapp:core');
                    if (value !== null) {
                      const core1 = JSON.parse(value);
                      const newValue = { ...core1, id: newregnos, branchid: br, scholars: newschonos, emails: emails };

                      setId(newregnos);
                      setScholars(newschonos);
                      setEmails(emails);


                      await AsyncStorage.setItem('@schoolapp:core', JSON.stringify(newValue));
                      //Actions.myProfile();

                    }
                  } catch (error) {
                    console.log(error);
                  }
                });

            }
            else if (test.status === 'suspended') {
              setStatus('suspended');
              if (navigation) navigation.navigate('Warning');
            }
            else if (test.role !== ro) {
              deleteAsyncData(branchid);
              setStatus('role-changed');
              if (navigation) navigation.navigate('Warning');
            }
          }
        } else {
          deleteAsyncData(branchid);
          setCoreValues('', '', branchid, '', '', '', 'deleted');
          setStatus('logout');
          if (navigation) navigation.navigate('Warning');
        }
      });
  };


  const deleteMessage = (id) => {

    const owner = phone;
    const enrid = id;
    const messageStorage = '@schoolapp:messages:' + branchid;

    axios.post('/deletemessage', { id, owner, branchid })
      .then(() => {

        const newMessages = messages.filter(msg => msg.id !== id);

        setMessages(newMessages);

        hydrate(messageStorage, newMessages);

      });

  };

  const updateConcessionMessage = (id, action) => {

    const messageStorage = '@schoolapp:messages:' + branchid;

    const updatedMessages = messages.map(msg => {
      if (msg.topicid === id)
        msg.concessionApprovalStatus = action;
      return msg;
    });


    setMessages(updatedMessages);

    hydrate(messageStorage, updatedMessages);

    //   loadSqlMessages_2(dispatch, getState);
    loadSqlMessages_3();


  };



  // const getVersion = async (isUpdateNeeded, current_version, navigation) => {

  //     const version = await checkVersion();

  //     // console.log("Got version info:", version);

  //     if (version.needsUpdate) {
  //         // alert(version.version);
  //         // alert(isUpdateNeeded);
  //         // alert('current version : ' + current_version);
  //         if (isUpdateNeeded === 'yes' && current_version === '0') // make current_version =1 if you do not want update popup to open.
  //             navigation.navigate('updateApp');
  //     }

  // };


  const setCoreValues = (phone, id, branchid, verified, role = 'student', utype = 'parent', status = 'active') => {
    setPhone(phone);
    setId(id);
    setBranchid(branchid);
    setVerified(verified);
    setRole(role);
    setUtype(utype);
    setStatus(status);

    axios.defaults.params = { medium: 'app', branchid: branchid, owner: phone, enrid: id };
  }



  const getAsyncData = async (navigation) => {
    try {
      const value = await AsyncStorage.getItem('@schoolapp:core');
      if (value !== null) {
        const { phone, id, branchid, verified, role, utype, classUrl } = JSON.parse(value);
        setCoreValues(phone, id, branchid, verified, role, utype);
        if (classUrl) setClassUrl(classUrl);

        const branch = grpBranches.find(b => b.branchid === branchid);
      //  console.log('branch found in getAsyncData', branch);
        setBranch(branch);
        if (phone && id && branchid && verified === 'ok') {
          navigation.replace('MainTabs');
        } else {
        }
      } else {
      }
    } catch (error) {
      console.log(error);
    }
  };


  const getAllClasses = async () => {

    const value = await AsyncStorage.getItem('@schoolapp:core');
    const ls = JSON.parse(value);
    const ro = ls?.role;
    const br = branchid ? branchid : ls?.branchid;

    const classes = unhydrate('@schoolapp:classes');

    if (classes) {
      classes.then((data) => {
        setAllClasses(data);
      });
    }

    axios.get('/getallclasses', { params: { branchid: br } })
      .then(response => {
        setAllClasses(response.data.rows);
        hydrate('@schoolapp:classes', response.data.rows);
      });

  };

  const getAllSections = () => {
    const sections = unhydrate('@schoolapp:sections');

    if (sections) {
      sections.then((data) => {
        setAllSections(data);
      });
    }

    axios.get('/getallsections', { params: { branchid } })
      .then(response => {
        setAllSections(response.data.rows);
        //    console.log('sections :', response.data.rows);
        hydrate('@schoolapp:sections', response.data.rows);
      });
  };


  const showToastMessage = (m) => {
    setToastMessage(m);
    setIsToastOpen(true);
  }

  const viewStaffCalendarAttendanceDetails = (attendancemonth, empid) => {

    const b = branchid;

    axios.get('/view-staff-calendar-attendance', { params: { attendancemonth, empid, branchid: b } })
      .then(response => {
        const rows = response.data?.rows ?? [];
        setStaffcalendarAttendanceDetails(rows);
        //  console.log('New report', response.data.rows);
      });
  };


  const getAllHolidays = (branchid) => {

    axios.get('/fetchholidays', { params: { branchid } })
      .then((response) => {
        setHolidays(response.data?.holidays ?? []);

        // console.log(response.data.holidays);
        if (response.data.holidays.length === 0) {
          showToastMessage('No holidays / events to show...')
        }
      });
  };


  const fetchHolidays = () => {
    const b = branchid;
    getAllHolidays(b);
  };

  const fetchMonthHolidays = (month, classid = '', action = '') => {

    const b = branchid;
    axios.get('/fetch-month-holidays', { params: { branchid, month, classid, action } })
      .then((response) => {
        setHolidays(response.data?.holidays ?? []);

        // console.log(response.data.holidays);
        if (response.data.holidays.length === 0) {
          showToastMessage('No holidays / events to show...')
        }
      });

  };

  const getCmo = () => {

    axios.get('getcmo').
      then(response => {

        setCmo(response.data.cmo);
        //alert(response.data.cmo);
      });

  };

  const showComingSoon = (url) => {
    showToastMessage('This tab will be available soon');
  }


  const addToAbsentList = (id, val) => {

    const initialAbsentStudents = absentStudents;
    let abs = [];
    if (val) {
      abs = [...new Set([...initialAbsentStudents, id])];
    } else {
      abs = initialAbsentStudents.filter(student => student !== id);
    }
    setAbsentStudents(abs);
    //  console.log('absentStudents', absentStudents);

  };

  const getAttendanceByClass = (classid, sectionid, attendancedate, filter, sort) => {
    console.log(filter, sort);
    const owner = phone;
    axios.get('/manage-student-attendance', {
      params:
        { classid, sectionid, pwadate: attendancedate, owner, branchid, filter, sort }
    })
      .then(response => {
        setStudentAttendanceDetails(response.data.rows);
        if (response.data.rows.length === 0) { showToastMessage('No students to show'); }
      });

  };


  const toggleAttendance = (stuid, attendancedate, astatus) => {

    const owner = phone;
    const attendanceDetails = studentAttendanceDetails;
    axios.post('/togglestudentattendance', { stuid, pwadate: attendancedate, astatus, owner, branchid })
      .then(() => {
        const newAttendanceDetails = attendanceDetails.map(att => {
          if (att.enrollment === stuid)
            return { ...att, status: astatus };
          else
            return att;
        });

        setStudentAttendanceDetails(newAttendanceDetails);
      });
  };





  const processConcessionRequest = async (requestId, action) => {
    try {
      const response = await axios.post('/process-concession', {
        id: requestId,
        action,
        owner: phone,
        branchid
      });
      if (response.data.message !== 'error') {
        updateConcessionMessage(requestId, action);
        return true;
      }
    } catch (e) { console.log(e); }
    return false;
  };

  const processReceiptCancelRequest = async (requestId, rsessionid, action, content, by) => {
    try {
      const response = await axios.post('/process-receipt', {
        id: requestId,
        sessionid: rsessionid,
        action,
        owner: phone,
        branchid,
        content,
        by
      });
      const result = response.data.message;
      if (result !== 'error') {
        updateConcessionMessage(requestId, action);
        return true;
      }
    } catch (e) { console.log(e); }
    return false;
  };

  return <CoreContext.Provider value={{
    owner: phone,
    id,
    isLoggedIn,
    phone,
    verified,
    utype,
    appUrl,
    role,
    checkIfVerified,
    branchid,
    setPhone,
    setVerified,
    otp,
    setOtp,
    setBranchid,
    grpBranches,
    classUrl,
    updateClassUrl,
    subjects,
    roles,
    feedbacks,
    isCached,
    fetchSubjects,
    fetchRoles,
    fetchFeedbacks,
    fetchStaffs,
    cacheStudents,
    allowedTabs,
    branch,
    setGrpBranches,
    schoolData,
    getSchoolData,
    checkUserValidity,
    messages,
    fetchCategories,
    categories,
    checkFcmToken,
    checkStudentAttendance,
    addAllEnqiryNo,
    addAllRegistrationNo,
    fetchSqlMessages,
    markMessageAsRead,
    deleteMessage,
    updateConcessionMessage,
    setToken,
    token,
    setMessages,
    status,
    allClasses,
    getAllClasses,
    allSections,
    getAllSections,
    currentScreen,
    setCurrentScreen,
    imgDocs,
    setImgDocs,
    uploadSingleImage,
    isToastOpen,
    toastMessage,
    showToastMessage,
    setIsToastOpen,
    viewStaffCalendarAttendanceDetails,
    staffcalendarAttendanceDetails,
    holidays,
    fetchHolidays,
    deleteAsyncData,
    setStatus,
    hasTabPermission,
    getAllowedTabs,
    staffs,
    getAllStaffs,
    cmo,
    getCmo,
    absentStudents,
    setAbsentStudents,
    studentsForAttendance,
    resetStudentsForAttednance,
    searchStudentsByClassForAttendance,
    addToAbsentList,
    studentAttendanceDetails,
    getAttendanceByClass,
    toggleAttendance,
    showComingSoon,
    selectedStudents,
    students,
    searchStudent,
    loading,
    searchStudentsByClass,
    filterStudent,
    months,
    getGroupBranches,

    processConcessionRequest,
    processReceiptCancelRequest,
    fetchAllBranches

  }}>{children}</CoreContext.Provider>;
}